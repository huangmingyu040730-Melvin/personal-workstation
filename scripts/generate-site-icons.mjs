#!/usr/bin/env node

// Run with `node scripts/generate-site-icons.mjs [--check]`.
// icon.svg is the editable source. Next.js supplies the image processor.
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.resolve("next"));
const sharp = require("sharp");
const appDirectory = new URL("../src/app/", import.meta.url);
const source = await readFile(new URL("icon.svg", appDirectory));
const check = process.argv.includes("--check");
const sizes = [16, 32, 48];

// ICO uses bottom-up BGRA DIB images and an aligned 1-bit transparency mask.
// This retains compatibility with clients that request /favicon.ico directly.
async function createBitmap(size) {
  const pixels = await sharp(source).resize(size, size).ensureAlpha().raw().toBuffer();
  const pixelBytes = size * size * 4;
  const maskStride = Math.ceil(size / 32) * 4;
  const bitmap = Buffer.alloc(40 + pixelBytes + maskStride * size);
  bitmap.writeUInt32LE(40, 0);
  bitmap.writeInt32LE(size, 4);
  bitmap.writeInt32LE(size * 2, 8);
  bitmap.writeUInt16LE(1, 12);
  bitmap.writeUInt16LE(32, 14);
  bitmap.writeUInt32LE(pixelBytes, 20);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const input = (y * size + x) * 4;
      const output = 40 + ((size - 1 - y) * size + x) * 4;
      bitmap[output] = pixels[input + 2];
      bitmap[output + 1] = pixels[input + 1];
      bitmap[output + 2] = pixels[input];
      bitmap[output + 3] = pixels[input + 3];
      if (pixels[input + 3] === 0) {
        bitmap[40 + pixelBytes + (size - 1 - y) * maskStride + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }
  return bitmap;
}

const bitmaps = await Promise.all(sizes.map(createBitmap));
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
sizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  directory[entry] = size;
  directory[entry + 1] = size;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(bitmaps[index].length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += bitmaps[index].length;
});

const files = [
  ["favicon.ico", Buffer.concat([directory, ...bitmaps])],
  ["apple-icon.png", await sharp(source).resize(180, 180).png().toBuffer()]
];
for (const [name, bytes] of files) {
  const path = new URL(name, appDirectory);
  if (check) {
    assert.deepEqual(await readFile(path), bytes, `${name} is not in sync with icon.svg`);
  } else {
    await writeFile(path, bytes);
  }
  console.log(`${check ? "Verified" : "Generated"} ${name} (${bytes.length} bytes)`);
}
