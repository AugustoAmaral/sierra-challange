import { beforeEach, afterEach, beforeAll, afterAll } from "bun:test";
import { mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { UPLOAD_DIR } from "./src/config/constants";
import { createApp } from "./src/app";
import type { Elysia } from "elysia";

// Global test app instance shared across all tests
export let testApp: Elysia;

beforeEach(async () => {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
});

afterEach(async () => {
  if (existsSync(UPLOAD_DIR))
    await rm(UPLOAD_DIR, { recursive: true, force: true });
});

beforeAll(async () => {
  testApp = await createApp();
  console.log("🧪 Test server initialized");
});

afterAll(() => {
  console.log("🧪 Test server cleaned up");
});
