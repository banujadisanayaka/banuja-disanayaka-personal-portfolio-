import { inflateRawSync } from "node:zlib";

const DRIVE_FILE_ID = "14FH7m96dROe3BVru-FMU9by5v15FeQFv";
const DRIVE_DOWNLOAD_URL = `https://drive.usercontent.google.com/download?id=${DRIVE_FILE_ID}&export=download&confirm=t`;
const TOTAL_PHOTOS = 116;

type ZipEntry = {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

let archivePromise: Promise<Buffer> | null = null;
let entriesPromise: Promise<ZipEntry[]> | null = null;

async function getArchive(): Promise<Buffer> {
  if (!archivePromise) {
    archivePromise = (async () => {
      const response = await fetch(DRIVE_DOWNLOAD_URL, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TheDailyGazeMoments/1.0)" }
      });
      if (!response.ok) {
        throw new Error(`Google Drive returned HTTP ${response.status}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        const hint = bytes.toString("utf8", 0, Math.min(bytes.length, 180)).replace(/\\s+/g, " ");
        throw new Error(`Drive did not return a ZIP archive: ${hint}`);
      }
      return bytes;
    })().catch(error => {
      archivePromise = null;
      throw error;
    });
  }
  return archivePromise;
}

function centralDirectory(buffer: Buffer): ZipEntry[] {
  const minOffset = Math.max(0, buffer.length - 22 - 0xffff);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= minOffset; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("ZIP end-of-central-directory record not found");

  const count = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];

  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("Invalid ZIP central-directory entry");
    }
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    if (/\\.webp$/i.test(name) && !name.endsWith("/")) {
      entries.push({ name, method, compressedSize, uncompressedSize, localHeaderOffset });
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  entries.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true, sensitivity: "base" }));
  if (entries.length !== TOTAL_PHOTOS) {
    throw new Error(`Expected ${TOTAL_PHOTOS} WebP images in the ZIP; found ${entries.length}`);
  }
  return entries;
}

async function getEntries(): Promise<ZipEntry[]> {
  if (!entriesPromise) {
    entriesPromise = getArchive().then(centralDirectory).catch(error => {
      entriesPromise = null;
      throw error;
    });
  }
  return entriesPromise;
}

function extractImage(buffer: Buffer, entry: ZipEntry): Buffer {
  const offset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error("Invalid ZIP local-file header");
  }
  const nameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);
  let output: Buffer;

  if (entry.method === 0) output = Buffer.from(compressed);
  else if (entry.method === 8) output = inflateRawSync(compressed, { maxOutputLength: entry.uncompressedSize + 1 });
  else throw new Error(`Unsupported ZIP compression method: ${entry.method}`);

  if (output.length !== entry.uncompressedSize) {
    throw new Error("Extracted image size does not match the ZIP directory");
  }
  return output;
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const url = new URL(req.url);
  const rawId = url.searchParams.get("id") || "";
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1 || id > TOTAL_PHOTOS) {
    return new Response("Photo not found", { status: 404 });
  }

  try {
    const [archive, entries] = await Promise.all([getArchive(), getEntries()]);
    const entry = entries[id - 1];
    const image = req.method === "HEAD" ? null : extractImage(archive, entry);
    const number = String(id).padStart(3, "0");
    const download = url.searchParams.get("download") === "1";
    const headers = new Headers({
      "Content-Type": "image/webp",
      "X-Robots-Tag": "noindex, nofollow, noarchive, noimageindex",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": download
        ? "private, max-age=0, must-revalidate"
        : "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
    });
    if (download) {
      headers.set("Content-Disposition", `attachment; filename="Mahi_21st_Birthday_Photo_${number}.webp"`);
    }
    if (image) headers.set("Content-Length", String(image.length));
    return new Response(image, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown photo source error";
    return new Response(`Mahi photo source unavailable: ${message}`, {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
    });
  }
};
