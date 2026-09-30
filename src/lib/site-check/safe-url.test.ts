import test from "node:test";
import assert from "node:assert/strict";
import { isPublicAddress, parseTargetUrl } from "./safe-url";

const ok = (input: string) => {
  const r = parseTargetUrl(input);
  assert.equal(r.ok, true, `expected ${JSON.stringify(input)} to be accepted, got ${JSON.stringify(r)}`);
  return r.ok ? r.url : (undefined as never);
};
const refused = (input: string) => {
  const r = parseTargetUrl(input);
  assert.equal(r.ok, false, `expected ${JSON.stringify(input)} to be refused`);
};

test("a bare domain becomes an https URL", () => {
  assert.equal(ok("example.com").href, "https://example.com/");
});

test("input is trimmed and keeps an explicit http scheme", () => {
  assert.equal(ok("  http://example.com/about  ").href, "http://example.com/about");
});

test("fragments are dropped, query strings kept", () => {
  assert.equal(ok("https://example.com/a?x=1#top").href, "https://example.com/a?x=1");
});

test("uppercase hosts are normalised", () => {
  assert.equal(ok("HTTPS://Example.COM").hostname, "example.com");
});

test("internationalised domains become punycode", () => {
  assert.equal(ok("https://bücher.de").hostname, "xn--bcher-kva.de");
});

test("empty, blank and oversized input is refused", () => {
  refused("");
  refused("   ");
  refused(`https://example.com/${"a".repeat(2100)}`);
});

test("only http and https schemes are accepted", () => {
  for (const bad of ["javascript:alert(1)", "file:///etc/passwd", "ftp://example.com", "data:text/html,hi", "gopher://example.com", "//example.com/x"]) refused(bad);
});

test("URLs with embedded credentials are refused", () => {
  refused("https://user:pass@example.com");
  refused("https://user@example.com");
});

test("only ports 80 and 443 are allowed", () => {
  ok("https://example.com:443");
  ok("http://example.com:80");
  for (const bad of ["https://example.com:22", "http://example.com:8080", "https://example.com:6379", "https://example.com:3000"]) refused(bad);
});

test("hosts that are not public domain names are refused", () => {
  for (const bad of ["localhost", "http://localhost/", "intranet", "printer.local", "db.internal", "app.localhost", "router.lan", "nas.home.arpa", "example.test", "x.invalid"]) refused(bad);
});

test("IP literals are refused, whatever the notation", () => {
  for (const bad of [
    "http://127.0.0.1", "http://10.0.0.5", "http://192.168.1.1", "http://169.254.169.254/latest/meta-data",
    "http://8.8.8.8", "http://[::1]/", "http://[fe80::1]/", "http://[::ffff:127.0.0.1]/",
    "http://2130706433/", "http://0x7f000001/", "http://0177.0.0.1/", "http://127.1/", "http://0/",
  ]) refused(bad);
});

test("a trailing dot on a host does not sneak past the suffix rules", () => {
  refused("http://localhost./");
  refused("http://printer.local./");
});

test("private and special IPv4 ranges are not public", () => {
  for (const ip of [
    "0.0.0.0", "0.1.2.3", "10.0.0.1", "10.255.255.255", "100.64.0.1", "100.127.255.255", "127.0.0.1", "127.255.255.254",
    "169.254.169.254", "172.16.0.1", "172.31.255.255", "192.0.0.1", "192.0.2.1", "192.168.0.1", "198.18.0.1", "198.19.255.255",
    "198.51.100.1", "203.0.113.9", "224.0.0.1", "239.255.255.255", "240.0.0.1", "255.255.255.255",
  ]) assert.equal(isPublicAddress(ip), false, ip);
});

test("ordinary public IPv4 addresses are public", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.15.255.255", "172.32.0.1", "100.63.255.255", "100.128.0.1", "198.17.255.255", "198.20.0.1", "11.0.0.1"]) {
    assert.equal(isPublicAddress(ip), true, ip);
  }
});

test("private and special IPv6 ranges are not public", () => {
  for (const ip of ["::", "::1", "fe80::1", "febf::1", "fc00::1", "fd12:3456::1", "ff02::1", "2001:db8::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:169.254.169.254", "64:ff9b::7f00:1", "64:ff9b::a00:1", "2002:7f00:1::1", "2002:0a00:1::1", "::127.0.0.1", "0:0:0:0:0:ffff:7f00:1"]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
});

test("ordinary public IPv6 addresses are public", () => {
  for (const ip of ["2606:4700:4700::1111", "2001:4860:4860::8888", "2a00:1450:4001:81c::200e", "::ffff:8.8.8.8"]) {
    assert.equal(isPublicAddress(ip), true, ip);
  }
});

test("anything that is not an IP address is not public", () => {
  for (const bad of ["", "example.com", "999.1.1.1", "1.2.3", "1.2.3.4.5", "01.2.3.4", "abc", "1.2.3.4 ", "::g"]) {
    assert.equal(isPublicAddress(bad), false, JSON.stringify(bad));
  }
});
