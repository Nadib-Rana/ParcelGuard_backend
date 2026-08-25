import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client as MinioClient } from "minio";
import * as path from "path";
import * as crypto from "crypto";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: MinioClient | null = null;
  private readonly defaultBucket: string;
  private readonly defaultExpirySeconds = 900; // 15 mins

  constructor(private readonly configService: ConfigService) {
    this.defaultBucket = this.configService.get<string>(
      "storage.bucket",
      "nest-starter-uploads",
    );
  }

  async onModuleInit() {
    const endPoint = this.configService.get<string>("storage.endpoint");
    const port = this.configService.get<number>("storage.port", 9000);
    const useSSL = this.configService.get<boolean>("storage.useSSL", false);
    const accessKey = this.configService.get<string>("storage.accessKey");
    const secretKey = this.configService.get<string>("storage.secretKey");

    if (endPoint && accessKey && secretKey) {
      try {
        this.minioClient = new MinioClient({
          endPoint,
          port,
          useSSL,
          accessKey,
          secretKey,
        });

        // Ensure default bucket exists
        const bucketExists = await this.minioClient.bucketExists(
          this.defaultBucket,
        );
        if (!bucketExists) {
          const region = this.configService.get<string>(
            "storage.region",
            "us-east-1",
          );
          await this.minioClient.makeBucket(this.defaultBucket, region);
          this.logger.log(`Created default storage bucket: ${this.defaultBucket}`);
        }
        this.logger.log("✅ Object storage (MinIO/S3) configured successfully");
      } catch (err) {
        this.logger.warn(
          "⚠️ Object storage connection not established. Uploads will use fallback URLs.",
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  isConfigured(): boolean {
    return this.minioClient !== null;
  }

  generateKey(folder = "uploads", originalName = "file"): string {
    const ext = path.extname(originalName);
    const randomHash = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    return `${folder}/${timestamp}-${randomHash}${ext}`;
  }

  getObjectUrl(key: string, bucket?: string): string {
    if (!key) return "";
    if (
      key.startsWith("http://") ||
      key.startsWith("https://") ||
      key.startsWith("data:")
    ) {
      return key;
    }
    const publicUrl = this.configService.get<string>("storage.publicUrl", "");
    const b = bucket || this.defaultBucket;
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, "")}/${b}/${key.replace(/^\//, "")}`;
    }
    return key;
  }

  async getPresignedUploadUrl(
    key: string,
    bucket?: string,
    expirySeconds?: number,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const b = bucket || this.defaultBucket;
    const expiry = expirySeconds || this.defaultExpirySeconds;

    if (!this.minioClient) {
      const fallbackUrl = this.getObjectUrl(key, b);
      return { uploadUrl: fallbackUrl, key, publicUrl: fallbackUrl };
    }

    try {
      const uploadUrl = await this.minioClient.presignedPutObject(
        b,
        key,
        expiry,
      );
      const publicUrl = this.getObjectUrl(key, b);
      return { uploadUrl, key, publicUrl };
    } catch {
      const fallbackUrl = this.getObjectUrl(key, b);
      return { uploadUrl: fallbackUrl, key, publicUrl: fallbackUrl };
    }
  }

  async getPresignedObjectUrl(
    key: string,
    bucket?: string,
    expirySeconds?: number,
  ): Promise<string> {
    if (!this.minioClient) {
      return this.getObjectUrl(key, bucket);
    }

    const b = bucket || this.defaultBucket;
    const expiry = expirySeconds || this.defaultExpirySeconds;

    try {
      return await this.minioClient.presignedGetObject(b, key, expiry);
    } catch {
      return this.getObjectUrl(key, b);
    }
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    mimeType?: string,
    bucket?: string,
  ): Promise<{ key: string; publicUrl: string }> {
    const b = bucket || this.defaultBucket;
    if (!this.minioClient) {
      return { key, publicUrl: this.getObjectUrl(key, b) };
    }

    await this.minioClient.putObject(b, key, buffer, buffer.length, {
      "Content-Type": mimeType || "application/octet-stream",
    });

    return {
      key,
      publicUrl: this.getObjectUrl(key, b),
    };
  }

  async deleteObject(key: string, bucket?: string): Promise<boolean> {
    if (!this.minioClient) {
      return true;
    }
    const b = bucket || this.defaultBucket;
    try {
      await this.minioClient.removeObject(b, key);
      return true;
    } catch (err) {
      this.logger.error(`Failed to delete object: ${key}`, err);
      return false;
    }
  }
}
