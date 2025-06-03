import React from 'react';
import { X } from 'lucide-react';

interface FilePreviewModalProps {
  url: string | null;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-[90vw] h-[90vh] bg-white rounded-lg shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <iframe
          src={url}
          className="w-full h-full rounded-lg"
          title="File Preview"
        />
      </div>
    </div>
  );
}

export default FilePreviewModal;