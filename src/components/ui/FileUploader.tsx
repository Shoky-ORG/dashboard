import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';
import './FileUploader.css';

export interface FileUploaderProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  file: File | null;
  onFileChange: (file: File | null) => void;
  helperText?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label = 'Upload File',
  accept,
  maxSizeMB = 10,
  file,
  onFileChange,
  helperText = 'PDF, Images, or Documents up to 10MB',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (selectedFile: File | undefined) => {
    setError(null);
    if (!selectedFile) return;

    if (maxSizeMB && selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    onFileChange(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="file-uploader-group">
      {label && <label className="file-uploader-label">{label}</label>}

      {!file ? (
        <div
          className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept={accept}
            onChange={(e) => handleFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
          <UploadCloud size={32} className="dropzone-icon" />
          <div className="dropzone-text">
            <span className="browse-link">Click to browse</span> or drag and drop file
          </div>
          <span className="dropzone-helper">{helperText}</span>
        </div>
      ) : (
        <div className="file-preview-card">
          <div className="file-info">
            <div className="file-icon-box">
              <File size={20} />
            </div>
            <div>
              <div className="file-name">{file.name}</div>
              <div className="file-size">{formatFileSize(file.size)}</div>
            </div>
          </div>
          <button
            type="button"
            className="file-remove-btn"
            onClick={() => onFileChange(null)}
            title="Remove file"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && <span className="file-uploader-error">{error}</span>}
    </div>
  );
};
