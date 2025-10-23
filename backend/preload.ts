import { beforeEach, afterEach } from "bun:test";
import { mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { UPLOAD_DIR } from "./src/config/constants";

beforeEach(async () => {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
});

afterEach(async () => {
  if (existsSync(UPLOAD_DIR))
    await rm(UPLOAD_DIR, { recursive: true, force: true });
});
