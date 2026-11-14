import {UploadCloud} from 'lucide-react';
import {useRef, useState, type ChangeEvent, type DragEvent} from 'react';
import {FILE_INPUT_ACCEPT} from '@/utils/fileSharing';

interface FileDropzoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
}

export function FileDropzone({onFilesSelected}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files);
    }
    e.target.value = '';
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
        isDragging
          ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/40'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={FILE_INPUT_ACCEPT}
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label="Upload project files"
      />
      <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
        <UploadCloud className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
        {isDragging ? 'Drop files to upload' : 'Upload files to this project'}
      </h3>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
        Drag and drop multiple files here, or{' '}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
        >
          browse from your device
        </button>
        .
      </p>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Allowed: Images (PNG, JPG, GIF, WebP, BMP, HEIC), PDF, ZIP, DOC/DOCX, XLS/XLSX · Max 25 MB per file
      </p>
    </div>
  );
}
