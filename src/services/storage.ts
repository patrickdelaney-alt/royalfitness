import { put, del } from "@vercel/blob";
import crypto from "crypto";
import path from "path";

export interface StorageProvider {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(url: string): Promise<void>;
}

export class VercelBlobStorageProvider implements StorageProvider {
  async upload(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    const ext = path.extname(filename);
    const uniqueName = `uploads/${crypto.randomUUID()}${ext}`;
    const blob = await put(uniqueName, file, {
      access: "public",
      contentType: mimeType,
    });
    return blob.url;
  }

  async delete(url: string): Promise<void> {
    await del(url);
  }
}

export const storage: StorageProvider = new VercelBlobStorageProvider();
