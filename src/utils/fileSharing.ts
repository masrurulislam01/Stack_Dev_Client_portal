import {
  ALLOWED_BUCKET_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  EXTENSION_ALLOWED_MIMES,
  EXTENSION_MIME_DEFAULTS,
  FILE_INPUT_ACCEPT,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/constants';
import {env} from '@/lib/env';

export {FILE_INPUT_ACCEPT, MAX_FILE_SIZE_BYTES};

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

export function sanitizeStorageFileName(fileName: string): string {
  const cleaned = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned.slice(0, 140) || 'file';
}

export type FileValidationResult =
  | {valid: true; extension: string; resolvedMimeType: string}
  | {valid: false; error: string};

export function validateProjectFile(file: File): FileValidationResult {
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

export function isTrustedStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const supabaseHost = new URL(env.supabaseUrl).hostname;
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.hostname === supabaseHost
    );
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

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
