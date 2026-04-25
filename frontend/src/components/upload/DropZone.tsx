import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileVideo, AlertCircle } from 'lucide-react';
import { PrivacyNotice } from './PrivacyNotice';

interface DropZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onUpload, isUploading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/quicktime': ['.mov'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <FileVideo className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-lg text-primary-600 font-medium">أفلت الفيديو هنا...</p>
        ) : (
          <>
            <p className="text-lg text-gray-700 font-medium mb-2">
              اسحب وأفلت تسجيل الشاشة هنا
            </p>
            <p className="text-sm text-gray-500">
              أو انقر لاختيار ملف (MP4, WebM, MOV — حتى 100MB)
            </p>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">خطأ في الملف</p>
            <p className="text-sm text-red-600">
              {fileRejections[0].errors[0].message}
            </p>
          </div>
        </div>
      )}

      <PrivacyNotice />
    </div>
  );
};
