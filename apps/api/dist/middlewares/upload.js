"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingDocUpload = exports.medicalCertUpload = exports.documentUpload = exports.avatarUpload = void 0;
exports.generateStorageKey = generateStorageKey;
exports.getFileBuffer = getFileBuffer;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
// ---------------------------------------------------------------------------
// Storage engine: memoryStorage for R2, diskStorage for local fallback
// ---------------------------------------------------------------------------
const useR2 = !!process.env.R2_ACCOUNT_ID;
function buildDiskStorage(dest) {
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            const uploadDir = path_1.default.join(__dirname, '../../uploads', dest);
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path_1.default.extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        },
    });
}
const storage = useR2
    ? multer_1.default.memoryStorage()
    : buildDiskStorage(''); // base uploads dir (each multer instance overrides via dest if needed)
// ---------------------------------------------------------------------------
// File filters
// ---------------------------------------------------------------------------
const imageFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
};
const documentFilter = (_req, file, cb) => {
    const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('File type not allowed. Accepted: PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG, GIF'));
    }
};
const medicalFilter = (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
    }
};
// ---------------------------------------------------------------------------
// Multer instances
// ---------------------------------------------------------------------------
exports.avatarUpload = (0, multer_1.default)({
    storage: useR2 ? multer_1.default.memoryStorage() : buildDiskStorage('avatars'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: imageFilter,
});
exports.documentUpload = (0, multer_1.default)({
    storage: useR2 ? multer_1.default.memoryStorage() : buildDiskStorage(''),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: documentFilter,
});
exports.medicalCertUpload = (0, multer_1.default)({
    storage: useR2 ? multer_1.default.memoryStorage() : buildDiskStorage('medical-certs'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: medicalFilter,
});
exports.onboardingDocUpload = (0, multer_1.default)({
    storage: useR2 ? multer_1.default.memoryStorage() : buildDiskStorage('onboarding'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: documentFilter,
});
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Generate a storage key for a given folder.
 * e.g. `avatars/avatar-1719000000-abc123.png`
 */
function generateStorageKey(folder, file, prefix) {
    const uniqueSuffix = Date.now() + '-' + crypto_1.default.randomBytes(6).toString('hex');
    const ext = path_1.default.extname(file.originalname);
    const name = prefix ? `${prefix}-${uniqueSuffix}${ext}` : `${uniqueSuffix}${ext}`;
    return `${folder}/${name}`;
}
/**
 * Get file contents as Buffer — works for both memory and disk storage.
 */
function getFileBuffer(file) {
    if (file.buffer)
        return file.buffer;
    // Disk storage — read from path
    return fs_1.default.readFileSync(file.path);
}
