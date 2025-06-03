import { supabase } from '../lib/supabase';
import { HistoryEntry, FileEntry } from '../types/history';

export const fetchHistory = async (): Promise<HistoryEntry[]> => {
  const { data, error } = await supabase
    .from('file_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Erreur lors de la récupération de l\'historique :', error);
    throw error;
  }
  
  return data || [];
};

export const addHistoryEntry = async (
  files: FileEntry[],
  status: string,
  message?: string
): Promise<void> => {
  const entry = {
    files,
    status,
    document_type: files[0]?.type,
    ...(message && { message })
  };

  const { error } = await supabase
    .from('file_history')
    .insert([entry]);
  
  if (error) {
    console.error('Erreur lors de l\'ajout dans l\'historique :', error);
    throw error;
  }
};

export const deleteHistoryEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('file_history')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression de l\'entrée :', error);
    throw error;
  }
};

export const deleteAllHistory = async (): Promise<void> => {
  const { error } = await supabase
    .from('file_history')
    .delete()
    .gte('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Erreur lors de la suppression de l\'historique :', error);
    throw error;
  }
}