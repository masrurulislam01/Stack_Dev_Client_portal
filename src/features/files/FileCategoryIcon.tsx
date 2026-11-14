import {File, FileArchive, FileImage, FileSpreadsheet, FileText} from 'lucide-react';
import {isImageExtension, isPdfFile} from '@/utils/fileSharing';

interface FileCategoryIconProps {
  extension: string;
  mimeType: string;
}

export function FileCategoryIcon({extension, mimeType}: FileCategoryIconProps) {
  const ext = extension.toLowerCase();
  if (isImageExtension(ext, mimeType)) {
    return (
      <div className="w-9 h-9 rounded-xl bg-info-soft text-info-text flex items-center justify-center shrink-0">
        <FileImage className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (isPdfFile(ext, mimeType)) {
    return (
      <div className="w-9 h-9 rounded-xl bg-danger-soft text-danger-text flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (ext === 'doc' || ext === 'docx') {
    return (
      <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (ext === 'zip') {
    return (
      <div className="w-9 h-9 rounded-xl bg-warning-soft text-warning-text flex items-center justify-center shrink-0">
        <FileArchive className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (ext === 'xls' || ext === 'xlsx') {
    return (
      <div className="w-9 h-9 rounded-xl bg-success-soft text-success-text flex items-center justify-center shrink-0">
        <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-surface-muted text-muted flex items-center justify-center shrink-0">
      <File className="w-4 h-4" aria-hidden="true" />
    </div>
  );
}
