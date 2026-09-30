import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import zlib from "node:zlib";
import type { AddressInfo } from "node:net";
import { safeFetch } from "./safe-fetch";

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

async function serve(handler: Handler) {
  let connections = 0;
  const server = http.createServer(handler);
  server.on("connection", () => connections++);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    port,
    connections: () => connections,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

// Lets the tests talk to a loopback server; the real defaults are exercised separately below.
const local = { validateUrl: () => null, allowAddress: () => true };

test("default rules refuse internal targets without opening a connection", async () => {
  const s = await serve((_req, res) => res.end("secret"));
  try {
    for (const target of [s.url, `http://localhost:${s.port}/`, "http://169.254.169.254/latest/meta-data/", "http://example.com:8080/", "file:///etc/passwd"]) {
      const r = await safeFetch(target);
      assert.equal(r.ok, false, target);
      assert.equal(r.ok ? "" : r.reason, "blocked-url", target);
    }
    assert.equal(s.connections(), 0);
  } finally {
    await s.close();
  }
});

test("a public-looking hostname that resolves to a private address is refused at connect time", async () => {
  const s = await serve((_req, res) => res.end("secret"));
  try {
    for (const address of ["127.0.0.1", "10.0.0.5", "169.254.169.254", "::1"]) {
      const r = await safeFetch("http://rebind.example.net/", {
        policy: { validateUrl: () => null },
        resolve: async () => [{ address, family: address.includes(":") ? 6 : 4 }],
      });
      assert.equal(r.ok, false, address);
      assert.equal(r.ok ? "" : r.reason, "blocked-address", address);
    }
    assert.equal(s.connections(), 0);
  } finally {
    await s.close();
  }
});

test("a host with one public and one private answer is refused outright", async () => {
  const r = await safeFetch("http://mixed.example.net/", {
    policy: { validateUrl: () => null },
    resolve: async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ],
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok ? "" : r.reason, "blocked-address");
});

test("returns status, lower-cased headers, final URL and body", async () => {
  const s = await serve((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "X-Custom": "yes" });
    res.end("<h1>Hello</h1>");
  });
  try {
    const r = await safeFetch(`${s.url}/page`, { policy: local });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.status, 200);
    assert.equal(r.body, "<h1>Hello</h1>");
    assert.equal(r.headers["x-custom"], "yes");
    assert.equal(r.headers["content-type"], "text/html; charset=utf-8");
    assert.equal(r.finalUrl, `${s.url}/page`);
    assert.equal(r.truncated, false);
    assert.equal(r.redirects, 0);
  } finally {
    await s.close();
  }
});

test("an error status is still a result, not a failure", async () => {
  const s = await serve((_req, res) => {
    res.writeHead(404);
    res.end("nope");
  });
  try {
    const r = await safeFetch(s.url, { policy: local });
    assert.equal(r.ok && r.status, 404);
  } finally {
    await s.close();
  }
});

test("identifies itself and asks for uncompressed or supported encodings only", async () => {
  let seen: http.IncomingHttpHeaders = {};
  const s = await serve((req, res) => {
    seen = req.headers;
    res.end("ok");
  });
  try {
    await safeFetch(s.url, { policy: local });
    assert.match(String(seen["user-agent"]), /TurtleWorksSiteCheck\/1\.0/);
    assert.match(String(seen["user-agent"]), /turtleworks\.in/);
    assert.equal(seen.cookie, undefined);
    assert.equal(seen.authorization, undefined);
    assert.match(String(seen["accept-encoding"]), /gzip/);
  } finally {
    await s.close();
  }
});

test("follows redirects, including relative ones, and reports the final URL", async () => {
  const s = await serve((req, res) => {
    if (req.url === "/a") {
      res.writeHead(301, { Location: "/b" });
      return res.end();
    }
    if (req.url === "/b") {
      res.writeHead(302, { Location: "/c" });
      return res.end();
    }
    res.end("landed");
  });
  try {
    const r = await safeFetch(`${s.url}/a`, { policy: local });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.body, "landed");
    assert.equal(r.finalUrl, `${s.url}/c`);
    assert.equal(r.redirects, 2);
  } finally {
    await s.close();
  }
});

test("a redirect to an internal address is refused", async () => {
  const s = await serve((_req, res) => {
    res.writeHead(302, { Location: "http://169.254.169.254/latest/meta-data/" });
    res.end();
  });
  try {
    const r = await safeFetch(s.url, { policy: { validateUrl: (u) => (u.hostname === "127.0.0.1" ? null : "blocked"), allowAddress: () => true } });
    assert.equal(r.ok, false);
    assert.equal(r.ok ? "" : r.reason, "blocked-url");
  } finally {
    await s.close();
  }
});

test("a redirect to a non-http scheme is refused", async () => {
  const s = await serve((_req, res) => {
    res.writeHead(302, { Location: "file:///etc/passwd" });
    res.end();
  });
  try {
    const r = await safeFetch(s.url, { policy: local });
    assert.equal(r.ok, false);
  } finally {
    await s.close();
  }
});

test("a redirect loop stops at the limit", async () => {
  const s = await serve((_req, res) => {
    res.writeHead(302, { Location: "/again" });
    res.end();
  });
  try {
    const r = await safeFetch(s.url, { policy: local, maxRedirects: 3 });
    assert.equal(r.ok, false);
    assert.equal(r.ok ? "" : r.reason, "too-many-redirects");
  } finally {
    await s.close();
  }
});

test("a redirect without a Location is a bad redirect", async () => {
  const s = await serve((_req, res) => {
    res.writeHead(302);
    res.end();
  });
  try {
    const r = await safeFetch(s.url, { policy: local });
    assert.equal(r.ok, false);
    assert.equal(r.ok ? "" : r.reason, "bad-redirect");
  } finally {
    await s.close();
  }
});

test("a large body is cut at the size limit", async () => {
  const s = await serve((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("x".repeat(2_000_000));
  });
  try {
    const r = await safeFetch(s.url, { policy: local, maxBytes: 100_000 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.truncated, true);
    assert.ok(r.body.length <= 100_000, `body was ${r.body.length}`);
    assert.ok(r.body.length >= 50_000);
  } finally {
    await s.close();
  }
});

test("gzip, deflate and brotli responses are decoded", async () => {
  const text = "<title>compressed</title>".repeat(20);
  const encoders: Record<string, (b: Buffer) => Buffer> = { gzip: zlib.gzipSync, deflate: zlib.deflateSync, br: zlib.brotliCompressSync };
  for (const [encoding, encode] of Object.entries(encoders)) {
    const s = await serve((_req, res) => {
      res.writeHead(200, { "Content-Encoding": encoding, "Content-Type": "text/html" });
      res.end(encode(Buffer.from(text)));
    });
    try {
      const r = await safeFetch(s.url, { policy: local });
      assert.equal(r.ok && r.body, text, encoding);
    } finally {
      await s.close();
    }
  }
});

test("a decompression bomb is stopped at the size limit", async () => {
  const bomb = zlib.gzipSync(Buffer.alloc(80_000_000, 0x61));
  assert.ok(bomb.length < 200_000);
  const s = await serve((_req, res) => {
    res.writeHead(200, { "Content-Encoding": "gzip", "Content-Type": "text/html" });
    res.end(bomb);
  });
  try {
    const before = process.memoryUsage().rss;
    const r = await safeFetch(s.url, { policy: local, maxBytes: 100_000 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.truncated, true);
    assert.ok(r.body.length <= 100_000);
    assert.ok(process.memoryUsage().rss - before < 60_000_000, "memory grew far beyond the cap");
  } finally {
    await s.close();
  }
});

test("a server that never answers times out", async () => {
  const s = await serve(() => {});
  try {
    const started = Date.now();
    const r = await safeFetch(s.url, { policy: local, timeoutMs: 300 });
    assert.equal(r.ok, false);
    assert.equal(r.ok ? "" : r.reason, "timeout");
    assert.ok(Date.now() - started < 2_000);
  } finally {
    await s.close();
  }
});

test("a server that drips the body forever times out on the overall deadline", async () => {
  const s = await serve((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    const timer = setInterval(() => res.write("x"), 50);
    res.on("close", () => clearInterval(timer));
  });
  try {
    const started = Date.now();
    const r = await safeFetch(s.url, { policy: local, timeoutMs: 400 });
    assert.equal(r.ok, false);
    assert.equal(r.ok ? "" : r.reason, "timeout");
    assert.ok(Date.now() - started < 2_000);
  } finally {
    await s.close();
  }
});

test("a dropped connection is a network failure", async () => {
  const s = await serve((req) => req.socket.destroy());
  try {
    const r = await safeFetch(s.url, { policy: local });
    assert.equal(r.ok, false);
    assert.equal(r.ok ? "" : r.reason, "network");
  } finally {
    await s.close();
  }
});

test("failures never leak internal error details", async () => {
  const r = await safeFetch("http://nothing.example.net/", {
    policy: { validateUrl: () => null },
    resolve: async () => {
      throw Object.assign(new Error("getaddrinfo ENOTFOUND nothing.example.net at /secret/path"), { code: "ENOTFOUND" });
    },
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok ? "" : r.reason, "network");
  assert.doesNotMatch(JSON.stringify(r), /secret|getaddrinfo/);
});
