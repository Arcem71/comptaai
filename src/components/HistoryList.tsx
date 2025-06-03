import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HistoryEntry } from '../types/history';
import { Clock, CheckCircle, XCircle, Folder, Loader2, Trash2 } from 'lucide-react';
import { deleteHistoryEntry, deleteAllHistory } from '../services/historyService';
import toast from 'react-hot-toast';

interface HistoryListProps {
  history: HistoryEntry[];
  isLoading: boolean;
  onHistoryUpdate: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, isLoading, onHistoryUpdate }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'classified':
        return <Folder className="h-5 w-5 text-secondary" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Renommé';
      case 'classified':
        return 'Classé';
      case 'error':
        return 'Erreur';
      default:
        return 'En attente';
    }
  };

  const formatMessage = (message: string) => {
    return message.split('|').join('\n').trim();
  };

  const handleDeleteEntry = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    try {
      await deleteHistoryEntry(id);
      toast.success('Entrée supprimée avec succès');
      await onHistoryUpdate();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllHistory();
      toast.success('Historique supprimé avec succès');
      await onHistoryUpdate();
    } catch (error) {
      console.error('Error deleting all history:', error);
      toast.error('Erreur lors de la suppression de l\'historique');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <Loader2 className="h-8 w-8 mb-4 animate-spin" />
        <p className="text-center">Chargement de l'historique...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-gray-200 rounded-lg bg-gray-50 text-gray-500">
        <Clock className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-center">
          Aucun historique disponible. Les opérations seront enregistrées ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary">
          Historique des opérations
        </h2>
        <button
          onClick={handleDeleteAll}
          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
          title="Supprimer tout l'historique"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[500px] overflow-y-auto space-y-3">
        {history.map((entry) => (
          <div 
            key={entry.id}
            className="border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {getStatusIcon(entry.status)}
                <span className="ml-2 text-sm font-medium text-primary">
                  {getStatusText(entry.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
                </span>
                <button
                  onClick={(e) => handleDeleteEntry(entry.id, e)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Supprimer cette entrée"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {entry.message && (
              <p className="text-sm text-gray-600 mt-2 mb-3 italic whitespace-pre-line">
                {formatMessage(entry.message)}
              </p>
            )}
            
            <div className="text-sm mt-2">
              <p className="text-gray-600 font-medium mb-2">Fichiers ({entry.files.length}) :</p>
              <div className="space-y-1.5 pl-2">
                {entry.files.map((file, index) => (
                  <div key={index} className="text-xs text-gray-500">
                    {file.renamed ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{file.renamed}</span>
                        <span className="text-gray-400">Original : {file.original}</span>
                      </div>
                    ) : (
                      file.original
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 italic mt-2 text-center">
        L'historique est conservé pendant 7 jours.
      </div>
    </div>
  );
};

export default HistoryList;