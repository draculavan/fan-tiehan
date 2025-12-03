import React, { useRef, useState } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert("请上传视频文件 (MP4, WEBM, MOV 等)");
      return;
    }
    // Reduced limit to 20MB to avoid "Rpc failed due to xhr error"
    // Base64 encoding adds ~33% overhead, so 20MB becomes ~27MB, close to browser/proxy limits.
    if (file.size > 20 * 1024 * 1024) {
      alert("为避免网络传输超时，请上传 20MB 以内的视频。长视频建议先压缩或剪辑。");
      return;
    }
    onFileSelect(file);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={`relative w-full max-w-2xl mx-auto h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ease-in-out cursor-pointer group
        ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-400 hover:bg-gray-800/50'}
        ${isProcessing ? 'opacity-50 pointer-events-none' : 'opacity-100'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="video/*"
        onChange={handleChange}
        disabled={isProcessing}
      />
      
      <div className="text-center p-6 space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
           <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
        </div>
        <div>
          <p className="text-xl font-medium text-white mb-2">点击或拖拽上传视频</p>
          <p className="text-sm text-gray-400">支持 MP4, MOV, WEBM (最大 20MB)</p>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;