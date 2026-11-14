import {File, FileArchive, FileImage, FileSpreadsheet, FileText} from 'lucide-react';
import {isImageExtension, isPdfFile} from '@/utils/fileSharing';

export function FileCategoryIcon({
  extension,
  mimeType,
}: {
  extension: string;
  mimeType: string;
}) {
  const ext = extension.toLowerCase();
  if (isImageExtension(ext, mimeType)) {
    return (
      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
        <FileImage className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (isPdfFile(ext, mimeType)) {
    return (
      <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (ext === 'zip') {
    return (
      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
        <FileArchive className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (ext === 'xls' || ext === 'xlsx') {
    return (
      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
        <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
      <File className="w-4 h-4" aria-hidden="true" />
    </div>
  );
}
