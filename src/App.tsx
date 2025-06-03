import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import HistoryList from './components/HistoryList';
import { fetchHistory, addHistoryEntry } from './services/historyService';
import { HistoryEntry, FileEntry } from './types/history';
import { Layout } from './components/Layout';
import { Trash2 } from 'lucide-react';
import { cleanupStorage } from './services/fileService';
import { Auth } from './components/Auth';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [renamedFiles, setRenamedFiles] = useState<FileEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const historyData = await fetchHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">
          Processeur de Documents PDF
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-primary">
                  Téléverser des fichiers PDF
                </h2>
                <button
                  onClick={cleanupStorage}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Nettoyer le stockage"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <FileUploader 
                setUploadedFiles={setUploadedFiles}
                setRenamedFiles={setRenamedFiles}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                onHistoryUpdate={loadHistory}
                addHistoryEntry={addHistoryEntry}
              />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">
                Fichiers renommés
              </h2>
              <FileList 
                uploadedFiles={uploadedFiles}
                renamedFiles={renamedFiles}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                onHistoryUpdate={loadHistory}
                addHistoryEntry={addHistoryEntry}
                setUploadedFiles={setUploadedFiles}
                setRenamedFiles={setRenamedFiles}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <HistoryList 
                history={history} 
                isLoading={isLoading}
                onHistoryUpdate={loadHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;