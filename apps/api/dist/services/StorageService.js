"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_s3_1 = require("@aws-sdk/client-s3");
// ---------------------------------------------------------------------------
// R2 (S3-compatible) Backend
// ---------------------------------------------------------------------------
class R2StorageBackend {
    constructor() {
        if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
            throw new Error('Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY');
        }
        this.client = new client_s3_1.S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });
        this.bucket = process.env.R2_BUCKET_NAME || 'hari-uploads';
        this.publicUrl = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev
    }
    upload(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: params.key,
                Body: params.body,
                ContentType: params.contentType,
            }));
            return params.key;
        });
    }
    download(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }));
            return {
                body: res.Body,
                contentType: res.ContentType || 'application/octet-stream',
                contentLength: res.ContentLength,
            };
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        });
    }
    getPublicUrl(key) {
        if (!this.publicUrl)
            return null;
        return `${this.publicUrl.replace(/\/+$/, '')}/${key}`;
    }
    getStorageUsed() {
        return __awaiter(this, void 0, void 0, function* () {
            let total = 0;
            let continuationToken;
            do {
                const res = yield this.client.send(new client_s3_1.ListObjectsV2Command({
                    Bucket: this.bucket,
                    ContinuationToken: continuationToken,
                }));
                for (const obj of res.Contents || []) {
                    total += obj.Size || 0;
                }
                continuationToken = res.NextContinuationToken;
            } while (continuationToken);
            return total;
        });
    }
}
// ---------------------------------------------------------------------------
// Local Disk Backend
// ---------------------------------------------------------------------------
class LocalStorageBackend {
    constructor() {
        this.baseDir = path_1.default.resolve(__dirname, '../../uploads');
    }
    /** Resolve key to a safe path within baseDir (prevent path traversal) */
    safePath(key) {
        const resolved = path_1.default.resolve(this.baseDir, key);
        if (!resolved.startsWith(this.baseDir + path_1.default.sep) && resolved !== this.baseDir) {
            throw new Error('Invalid storage key');
        }
        return resolved;
    }
    upload(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = this.safePath(params.key);
            const dir = path_1.default.dirname(filePath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            fs_1.default.writeFileSync(filePath, params.body);
            return params.key;
        });
    }
    download(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = this.safePath(key);
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error('File not found on disk');
            }
            const stat = fs_1.default.statSync(filePath);
            const ext = path_1.default.extname(filePath).toLowerCase();
            const mimeMap = {
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
            };
            return {
                body: fs_1.default.createReadStream(filePath),
                contentType: mimeMap[ext] || 'application/octet-stream',
                contentLength: stat.size,
            };
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = this.safePath(key);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        });
    }
    getPublicUrl(key) {
        return `/uploads/${key}`;
    }
    getStorageUsed() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getDirectorySize(this.baseDir);
        });
    }
    getDirectorySize(dirPath) {
        if (!fs_1.default.existsSync(dirPath))
            return 0;
        let total = 0;
        for (const entry of fs_1.default.readdirSync(dirPath)) {
            const fullPath = path_1.default.join(dirPath, entry);
            const stat = fs_1.default.statSync(fullPath);
            total += stat.isDirectory() ? this.getDirectorySize(fullPath) : stat.size;
        }
        return total;
    }
}
// ---------------------------------------------------------------------------
// Factory — pick backend based on environment
// ---------------------------------------------------------------------------
function createStorageBackend() {
    if (process.env.R2_ACCOUNT_ID) {
        console.log('[Storage] Using Cloudflare R2 backend');
        return new R2StorageBackend();
    }
    console.log('[Storage] Using local disk backend');
    return new LocalStorageBackend();
}
exports.storageService = createStorageBackend();
