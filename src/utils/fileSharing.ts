import {
  ALLOWED_BUCKET_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  EXTENSION_ALLOWED_MIMES,
  EXTENSION_MIME_DEFAULTS,
  FILE_INPUT_ACCEPT,
  MAX_FILE_SIZE_BYTES,
} from '@/config/constants';
import {env, isDemoMode} from '@/lib/env';

export {
  ALLOWED_BUCKET_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  FILE_INPUT_ACCEPT,
  MAX_FILE_SIZE_BYTES,
};

export function getFileExtension(fileName: string): string {
  const trimmed = fileName.trim();
  const dotIdx = trimmed.lastIndexOf('.');
  if (dotIdx <= 0 || dotIdx === trimmed.length - 1) return '';
  return trimmed.slice(dotIdx + 1).toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

export function isImageExtension(ext: string, mimeType = ''): boolean {
  const clean = ext.toLowerCase();
  if ((ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(clean)) return true;
  const lowerMime = mimeType.toLowerCase();
  return lowerMime.startsWith('image/') && lowerMime !== 'image/svg+xml';
}

export function isPdfFile(ext: string, mimeType = ''): boolean {
  return ext.toLowerCase() === 'pdf' || mimeType.toLowerCase() === 'application/pdf';
}

export function isPreviewableFile(ext: string, mimeType = ''): boolean {
  return isImageExtension(ext, mimeType) || isPdfFile(ext, mimeType);
}

export function getFileTypeLabel(ext: string, mimeType = ''): string {
  const clean = ext.toLowerCase();
  if (isImageExtension(clean, mimeType)) {
    return `${clean ? clean.toUpperCase() : 'Image'} Image`;
  }
  switch (clean) {
    case 'pdf':
      return 'PDF Document';
    case 'zip':
      return 'ZIP Archive';
    case 'doc':
    case 'docx':
      return 'Word Document';
    case 'xls':
    case 'xlsx':
      return 'Excel Spreadsheet';
    default:
      return clean ? `${clean.toUpperCase()} File` : 'File';
  }
}

const UNSAFE_FILENAME_REGEX = /[\x00-\x1f\x7f/\\\u202a-\u202e\u2066-\u2069]/;

export function hasUnsafeFileName(fileName: string): boolean {
  const trimmed = fileName.trim();
  return !trimmed || trimmed.includes('..') || UNSAFE_FILENAME_REGEX.test(trimmed);
}

export function sanitizeStorageFileName(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() ?? fileName;
  const cleaned = baseName
    .trim()
    .replace(/\.\.+/g, '.')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^[_.-]+|_+$/g, '');
  return cleaned.slice(0, 140) || 'file';
}

export type FileValidationResult =
  | {valid: true; extension: string; resolvedMimeType: string}
  | {valid: false; error: string};

export function validateProjectFile(file: File): FileValidationResult {
  if (hasUnsafeFileName(file.name)) {
    return {
      valid: false,
      error: `"${file.name}" contains invalid path or control characters and cannot be uploaded.`,
    };
  }

  const ext = getFileExtension(file.name);

  if (file.size <= 0) {
    return {
      valid: false,
      error: `"${file.name}" is empty (0 bytes) and cannot be uploaded.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" exceeds the 25 MB limit (${formatFileSize(file.size)}).`,
    };
  }

  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return {
      valid: false,
      error: `"${file.name}" is not a supported file type. Allowed: images (PNG, JPG, GIF, WebP, BMP, HEIC), PDF, ZIP, DOC/DOCX, XLS/XLSX.`,
    };
  }

  const rawType = (file.type || '').toLowerCase().trim();
  const defaultMime = EXTENSION_MIME_DEFAULTS[ext] ?? 'application/octet-stream';

  if (rawType) {
    if ((ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
      if (
        rawType === 'image/svg+xml' ||
        (!rawType.startsWith('image/') && rawType !== 'application/octet-stream')
      ) {
        return {
          valid: false,
          error: `"${file.name}" has an unsupported MIME type (${rawType}) for an image.`,
        };
      }
    } else {
      const allowedMimes = EXTENSION_ALLOWED_MIMES[ext] ?? [];
      if (allowedMimes.length > 0 && !allowedMimes.includes(rawType)) {
        return {
          valid: false,
          error: `"${file.name}" has an unsupported MIME type (${rawType}) for .${ext} files.`,
        };
      }
    }
  }

  const resolvedMimeType =
    rawType &&
    rawType !== 'application/octet-stream' &&
    (ALLOWED_BUCKET_MIME_TYPES as readonly string[]).includes(rawType)
      ? rawType
      : defaultMime;

  return {
    valid: true,
    extension: ext,
    resolvedMimeType,
  };
}

function matchesBytes(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  if (bytes.length < offset + prefix.length) return false;
  for (let i = 0; i < prefix.length; i += 1) {
    if (bytes[offset + i] !== prefix[i]) return false;
  }
  return true;
}

function readAscii(bytes: Uint8Array, start: number, length: number): string {
  const end = Math.min(bytes.length, start + length);
  let out = '';
  for (let i = start; i < end; i += 1) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function verifyMagicBytesForExtension(ext: string, bytes: Uint8Array): boolean {
  const headText = readAscii(bytes, 0, 64).trimStart().toLowerCase();
  if (
    headText.startsWith('<!doctype') ||
    headText.startsWith('<html') ||
    headText.startsWith('<script') ||
    headText.startsWith('<svg')
  ) {
    return false;
  }

  switch (ext) {
    case 'png':
      return matchesBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'jpg':
    case 'jpeg':
      return matchesBytes(bytes, [0xff, 0xd8, 0xff]);
    case 'gif': {
      const sig = readAscii(bytes, 0, 6);
      return sig === 'GIF87a' || sig === 'GIF89a';
    }
    case 'webp':
      return readAscii(bytes, 0, 4) === 'RIFF' && readAscii(bytes, 8, 4) === 'WEBP';
    case 'bmp':
      return readAscii(bytes, 0, 2) === 'BM';
    case 'heic':
    case 'heif':
      return readAscii(bytes, 4, 4) === 'ftyp';
    case 'pdf':
      return readAscii(bytes, 0, 16).includes('%PDF-');
    case 'zip':
    case 'docx':
    case 'xlsx':
      return (
        matchesBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
        matchesBytes(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
        matchesBytes(bytes, [0x50, 0x4b, 0x07, 0x08])
      );
    case 'doc':
    case 'xls':
      return matchesBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    default:
      return false;
  }
}

export async function validateProjectFileMagicBytes(file: File): Promise<FileValidationResult> {
  const base = validateProjectFile(file);
  if (!base.valid) return base;

  try {
    const buffer = await file.slice(0, 64).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (!verifyMagicBytesForExtension(base.extension, bytes)) {
      return {
        valid: false,
        error: `"${file.name}" does not match the expected .${base.extension} file signature.`,
      };
    }
    return base;
  } catch {
    return {
      valid: false,
      error: `Unable to read "${file.name}" for file type verification.`,
    };
  }
}

export function isTrustedStorageUrl(url: string): boolean {
  if (isDemoMode && (url.startsWith('data:image/') || url.startsWith('blob:'))) {
    return !url.toLowerCase().startsWith('data:image/svg');
  }
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return false;
    const supabaseParsed = new URL(env.supabaseUrl);
    if (parsed.hostname !== supabaseParsed.hostname || parsed.port !== supabaseParsed.port) {
      return false;
    }
    if (supabaseParsed.protocol === 'https:') {
      return parsed.protocol === 'https:';
    }
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function triggerFileDownload(url: string, fileName: string): Promise<void> {
  if (!url || !isTrustedStorageUrl(url)) {
    const err = new Error('Download URL is missing, expired, or from an untrusted host.');
    console.error('[fileSharing] Blocked untrusted or empty download URL:', url);
    throw err;
  }

  let response: Response;
  try {
    response = await fetch(url);
  } catch (networkErr) {
    console.error('[fileSharing] Fetch error while downloading file:', networkErr);
    throw new Error('Network error while downloading file. Please try again.');
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    console.error(
      `[fileSharing] Storage download HTTP ${response.status} for "${fileName}":`,
      bodyText,
    );
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new Error('Download link expired or access was denied. Please try again.');
    }
    throw new Error(`Unable to download "${fileName}" (HTTP ${response.status}).`);
  }

  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  if (contentType.includes('text/html') || contentType.includes('image/svg+xml')) {
    throw new Error('Blocked unsafe file content type from storage.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = sanitizeStorageFileName(fileName);
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
