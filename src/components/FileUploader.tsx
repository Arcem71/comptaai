import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, XCircle, Loader2, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { renameFiles, cleanupStorage } from '../services/fileService';
import type { FileEntry } from '../types/history';

interface FileUploaderProps {
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setRenamedFiles: React.Dispatch<React.SetStateAction<FileEntry[]>>;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  onHistoryUpdate: () => void;
  addHistoryEntry: (files: FileEntry[], status: string) => Promise<void>;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  setUploadedFiles,
  setRenamedFiles,
  isProcessing,
  setIsProcessing,
  onHistoryUpdate,
  addHistoryEntry
}) => {
  const [files, setFiles] = useState<File[]>([]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(
      file => file.type === 'application/pdf'
    );
    
    if (pdfFiles.length !== acceptedFiles.length) {
      toast.error('Seuls les fichiers PDF sont acceptés');
    }
    
    if (pdfFiles.length > 0) {
      setFiles(prev => [...prev, ...pdfFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRenameFiles = async () => {
    if (files.length === 0) {
      toast.error('Aucun fichier à traiter');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await renameFiles(files);
      
      if (result.success && result.renamedFiles) {
        setUploadedFiles(files);
        setRenamedFiles(result.renamedFiles);
        await addHistoryEntry(result.renamedFiles, 'success');
        onHistoryUpdate();
        setFiles([]);
      } else {
        toast.error(result.error || 'Erreur lors du renommage des fichiers');
        await addHistoryEntry(
          files.map(file => ({ original: file.name, renamed: '' })), 
          'error'
        );
        onHistoryUpdate();
      }
    } catch (error) {
      console.error('Error renaming files:', error);
      toast.error('Erreur lors du renommage des fichiers');
      await addHistoryEntry(
        files.map(file => ({ original: file.name, renamed: '' })), 
        'error'
      );
      onHistoryUpdate();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ease-in-out cursor-pointer ${
          isDragActive 
            ? 'border-secondary bg-blue-50' 
            : 'border-gray-300 hover:border-secondary hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <Upload className="h-12 w-12 text-secondary" />
          <p className="text-lg font-medium text-primary">
            {isDragActive
              ? 'Déposez les fichiers ici...'
              : 'Glissez-déposez des fichiers PDF ici, ou cliquez pour sélectionner'}
          </p>
          <p className="text-sm text-gray-500">Formats acceptés : PDF uniquement</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-primary">Fichiers sélectionnés</h3>
          <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border border-gray-200 p-3">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-secondary mr-2" />
                  <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                    {file.name}
                  </span>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  disabled={isProcessing}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleRenameFiles}
            disabled={isProcessing || files.length === 0}
            className={`w-full py-2.5 px-4 rounded-md font-medium transition-colors ${
              isProcessing || files.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-secondary hover:bg-secondary-dark text-white'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Traitement en cours...
              </span>
            ) : (
              'Renommer les fichiers'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;