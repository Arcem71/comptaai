export interface FileEntry {
  original: string;
  renamed: string;
  storagePath?: string;
  type?: string;
}

export interface HistoryEntry {
  id: string;
  created_at: string;
  files: FileEntry[];
  status: string;
  message?: string;
  file_data?: Record<string, any>;
  document_type?: string;
}