import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFileLoaded: (content: string, filename: string) => void;
  loading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);

    // Check file extension
    const allowedExtensions = ['.nc', '.gcode', '.txt', '.ngc'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      setError('Please select a valid NC file (.nc, .gcode, .txt, .ngc)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onFileLoaded(content, file.name);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <h3>📁 Upload NC File</h3>
      <p>Upload your own NC/G-code files for simulation</p>

      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".nc,.gcode,.txt,.ngc"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={loading}
        />

        <div className="upload-content">
          <div className="upload-icon">📎</div>
          <div className="upload-text">
            <p><strong>Click to browse</strong> or drag and drop</p>
            <p className="upload-hint">NC, G-code, or text files (.nc, .gcode, .txt, .ngc)</p>
            <p className="upload-limit">Max file size: 10MB</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="upload-error">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="upload-info">
        <h4>Supported File Types:</h4>
        <ul>
          <li><strong>.nc</strong> - Numerical Control files</li>
          <li><strong>.gcode</strong> - G-code files</li>
          <li><strong>.txt</strong> - Text files with G-code</li>
          <li><strong>.ngc</strong> - NGC files</li>
        </ul>
      </div>
    </div>
  );
};