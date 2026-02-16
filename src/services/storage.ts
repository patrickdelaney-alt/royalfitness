/**
 * Storage Provider Interface
 *
 * MVP: Local file storage to /public/uploads
 * Phase 2: Swap to S3StorageProvider
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageProvider {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(url: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  async upload(
    file: Buffer,
    filename: string,
    _mimeType: string
  ): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const ext = path.extname(filename);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    await fs.writeFile(filePath, file);
    return `/uploads/${uniqueName}`;
  }

  async delete(url: string): Promise<void> {
    const filename = url.replace("/uploads/", "");
    const filePath = path.join(this.uploadDir, filename);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist, ignore
    }
  }
}

/**
 * Stub for S3 — Phase 2 implementation.
 */
export class S3StorageProvider implements StorageProvider {
  async upload(
    _file: Buffer,
    _filename: string,
    _mimeType: string
  ): Promise<string> {
    throw new Error("S3 storage not yet implemented. Coming in Phase 2.");
  }

  async delete(_url: string): Promise<void> {
    throw new Error("S3 storage not yet implemented. Coming in Phase 2.");
  }
}

// Singleton — swap implementation in Phase 2
export const storage: StorageProvider = new LocalStorageProvider();
