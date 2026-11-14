import {UploadCloud} from 'lucide-react';
import {useRef, useState, type ChangeEvent, type DragEvent, type RefObject} from 'react';
import {FILE_INPUT_ACCEPT} from '@/utils/fileSharing';

interface FileDropzoneProps {
  onSelectFiles: (files: FileList | File[]) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function FileDropzone({onSelectFiles, inputRef}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = inputRef ?? internalInputRef;
  const dragCounterRef = useRef(0);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onSelectFiles(e.target.files);
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
      onSelectFiles(e.dataTransfer.files);
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
          ? 'border-primary-600 bg-primary-50'
          : 'border-border-strong bg-surface hover:border-primary-200'
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
      <div className="mx-auto w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
        <UploadCloud className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-sm sm:text-base font-semibold text-foreground">
        {isDragging ? 'Drop files to upload' : 'Upload files to this project'}
      </h3>
      <p className="mt-1 text-xs sm:text-sm text-muted max-w-lg mx-auto">
        Drag and drop multiple files here, or{' '}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="font-semibold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring rounded"
        >
          browse from your device
        </button>
        .
      </p>
      <p className="mt-2 text-xs text-subtle">
        Allowed: Images (PNG, JPG, GIF, WebP, BMP, HEIC), PDF, ZIP, DOC/DOCX, XLS/XLSX · Max 25
        MB per file
      </p>
    </div>
  );
}
