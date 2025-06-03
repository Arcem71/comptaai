import React, { useState } from 'react';
import { FileText, Loader2, PenLine, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { classifyFiles, getFilePreviewUrl } from '../services/fileService';
import type { FileEntry } from '../types/history';
import FilePreviewModal from './FilePreviewModal';

interface FileListProps {
  uploadedFiles: File[];
  renamedFiles: FileEntry[];
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  onHistoryUpdate: () => void;
  addHistoryEntry: (files: FileEntry[], status: string, message?: string) => Promise<void>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setRenamedFiles: React.Dispatch<React.SetStateAction<FileEntry[]>>;
}

const FileList: React.FC<FileListProps> = ({
  uploadedFiles,
  renamedFiles,
  isProcessing,
  setIsProcessing,
  onHistoryUpdate,
  addHistoryEntry,
  setUploadedFiles,
  setRenamedFiles
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleClassify = async () => {
    if (uploadedFiles.length === 0 || renamedFiles.length === 0) {
      toast.error('Aucun fichier à classer');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await classifyFiles(uploadedFiles, renamedFiles);
      
      if (result.success) {
        await addHistoryEntry(renamedFiles, 'classified', result.message);
        onHistoryUpdate();
        setUploadedFiles([]);
        setRenamedFiles([]);
      } else {
        toast.error(result.error || 'Erreur lors de la classification des fichiers');
        await addHistoryEntry(renamedFiles, 'error');
        onHistoryUpdate();
      }
    } catch (error) {
      console.error('Erreur lors de la classification des fichiers:', error);
      toast.error('Erreur lors de la classification des fichiers');
      await addHistoryEntry(renamedFiles, 'error');
      onHistoryUpdate();
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(renamedFiles[index].renamed);
  };

  const handleEdit = (index: number) => {
    if (editValue.trim() === '') {
      toast.error('Le nom du fichier ne peut pas être vide');
      return;
    }

    const newRenamedFiles = [...renamedFiles];
    newRenamedFiles[index] = {
      ...newRenamedFiles[index],
      renamed: editValue.trim()
    };
    setRenamedFiles(newRenamedFiles);
    setEditingIndex(null);
    setEditValue('');
    toast.success('Fichier renommé avec succès');
  };

  const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleEdit(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handlePreview = async (file: FileEntry) => {
    if (!file.storagePath) {
      toast.error('Aperçu non disponible pour ce fichier');
      return;
    }

    try {
      const url = await getFilePreviewUrl(file.storagePath);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de l\'aperçu:', error);
      toast.error('Erreur lors de l\'ouverture de l\'aperçu');
    }
  };

  const handleDelete = (index: number) => {
    const newUploadedFiles = [...uploadedFiles];
    const newRenamedFiles = [...renamedFiles];
    
    newUploadedFiles.splice(index, 1);
    newRenamedFiles.splice(index, 1);
    
    setUploadedFiles(newUploadedFiles);
    setRenamedFiles(newRenamedFiles);
    toast.success('Fichier supprimé');
  };

  if (renamedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-gray-200 rounded-lg bg-gray-50 text-gray-500">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-center">
          Aucun fichier renommé. Veuillez téléverser et renommer des fichiers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border border-gray-200 p-3">
        {renamedFiles.map((file, index) => (
          <div 
            key={`renamed-${index}`} 
            className="flex items-center p-3 bg-gray-50 rounded-md animate-fadeIn transition-all duration-300"
          >
            <button
              onClick={() => handlePreview(file)}
              className="text-secondary hover:text-secondary-dark transition-colors mr-2"
              title="Voir l'aperçu"
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
            </button>
            <div className="flex-1 min-w-0">
              {editingIndex === index ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleEdit(index)}
                  onKeyDown={(e) => handleKeyPress(e, index)}
                  className="w-full px-2 py-1 text-sm border border-secondary rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                  autoFocus
                />
              ) : (
                <div onClick={() => !isProcessing && startEditing(index)} className="cursor-pointer">
                  <p className="text-sm font-medium text-gray-700 truncate hover:text-secondary transition-colors">
                    {file.renamed}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Original : {file.original}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isProcessing && editingIndex !== index && (
                <button
                  onClick={() => startEditing(index)}
                  className="text-gray-400 hover:text-secondary transition-colors"
                  title="Renommer"
                >
                  <PenLine className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Supprimer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleClassify}
        disabled={isProcessing || renamedFiles.length === 0}
        className={`w-full py-2.5 px-4 rounded-md font-medium transition-colors ${
          isProcessing || renamedFiles.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary hover:bg-primary-dark text-white'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Classification en cours...
          </span>
        ) : (
          'Classer les fichiers'
        )}
      </button>

      <FilePreviewModal 
        url={previewUrl} 
        onClose={() => setPreviewUrl(null)} 
      />
    </div>
  );
};

export default FileList;