import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const assets = [
  {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/6c4e943f-2d6b-43ba-90a5-dba804fbda2c.mp4",
    destination: "public/videos/turtle-desktop.mp4",
  },
  {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/e7c43a6f-c1ee-49d0-b2e4-b8d65ddc083f.mp4",
    destination: "public/videos/turtle-mobile.mp4",
  },
];

async function syncAsset({ url, destination }) {
  const target = resolve(destination);
  const temp = target + ".tmp";
  await mkdir(dirname(target), { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      "Failed to download " + destination + ": " + response.status + " " + response.statusText,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("video/mp4")) {
    throw new Error(
      "Unexpected content type for " + destination + ": " + contentType,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1_000_000) {
    throw new Error(
      "Downloaded hero video is unexpectedly small: " + destination,
    );
  }

  await writeFile(temp, bytes);
  await rename(temp, target).catch(async (error) => {
    await unlink(temp).catch(() => {});
    throw error;
  });

  console.log("Synced " + destination + " (" + bytes.length + " bytes)");
}

for (const asset of assets) {
  await syncAsset(asset);
}
