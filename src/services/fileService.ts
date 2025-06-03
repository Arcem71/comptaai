import toast from 'react-hot-toast';
import pRetry from 'p-retry';
import type { FileEntry } from '../types/history';
import { supabase } from '../lib/supabase';

const API_URL = 'https://n8n.arcem-assurances.fr/webhook/renom-doc';

export interface RenameResponse {
  success: boolean;
  renamedFiles?: FileEntry[];
  error?: string;
}

export interface ClassifyResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface WebhookResponse {
  nouveau_nom: string;
  type: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (formData: FormData): Promise<Response> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error details available');
    throw new Error(`HTTP Error ${response.status}: ${errorText}`);
  }

  return response;
};

export const getFilePreviewUrl = async (path: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600); // URL valid for 1 hour

    if (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned');
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getFilePreviewUrl:', error);
    throw new Error('Failed to generate preview URL');
  }
};

export const cleanupStorage = async (): Promise<void> => {
  try {
    // First, ensure the uploads folder exists by trying to create it
    const emptyFile = new File([''], '.keep', { type: 'text/plain' });
    await supabase.storage
      .from('documents')
      .upload('uploads/.keep', emptyFile, {
        cacheControl: '3600',
        upsert: true
      });

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manual-cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cleanup storage');
    }

    const data = await response.json();
    toast.success(`Nettoyage réussi: ${data.deletedFiles?.length || 0} fichiers supprimés`);
  } catch (error) {
    console.error('Error cleaning up storage:', error);
    toast.error('Erreur lors du nettoyage du stockage');
  }
};

const uploadToStorage = async (file: File, fileName: string): Promise<string> => {
  try {
    const path = `uploads/${fileName}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    if (!data?.path) {
      throw new Error('No path returned from upload');
    }

    return data.path;
  } catch (error) {
    console.error('Error in uploadToStorage:', error);
    throw new Error('Failed to upload file');
  }
};

export const renameFiles = async (files: File[]): Promise<RenameResponse> => {
  const renamedFiles: FileEntry[] = [];
  let hasError = false;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('action', 'renommage');
      formData.append('files', file);

      toast.loading(`Renaming file ${i + 1} of ${files.length}...`, { id: `rename-${i}` });

      try {
        const response = await pRetry(
          async () => makeRequest(formData),
          {
            retries: 3,
            onFailedAttempt: error => {
              console.log(
                `Attempt ${error.attemptNumber} failed for file ${file.name}. ${error.retriesLeft} retries left.`
              );
              toast.error(`Retry attempt ${error.attemptNumber} for ${file.name}...`, { id: `rename-${i}` });
            },
          }
        );

        const webhookResponse: WebhookResponse = await response.json();

        if (webhookResponse.nouveau_nom) {
          let storagePath: string | undefined;
          
          try {
            storagePath = await uploadToStorage(file, webhookResponse.nouveau_nom);
            toast.success(`File ${i + 1} uploaded successfully!`, { id: `upload-${i}` });
          } catch (uploadError) {
            console.error('Error uploading to storage:', uploadError);
            toast.error(`Error uploading ${webhookResponse.nouveau_nom} to storage`, { id: `upload-error-${i}` });
          }

          renamedFiles.push({
            original: file.name,
            renamed: webhookResponse.nouveau_nom,
            storagePath,
            type: webhookResponse.type
          });
          
          toast.success(`File ${i + 1} renamed successfully!`, { id: `rename-${i}` });
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error(`Error renaming file ${file.name}:`, error);
        hasError = true;
        toast.error(
          error instanceof Error 
            ? `Error renaming ${file.name}: ${error.message}` 
            : `Error renaming ${file.name}`,
          { id: `rename-${i}` }
        );
      }

      if (i < files.length - 1) {
        await delay(100);
      }
    }

    if (hasError) {
      return {
        success: false,
        error: 'Some files failed to rename'
      };
    }

    return {
      success: true,
      renamedFiles
    };
  } catch (error) {
    console.error('Error in rename operation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const classifyFiles = async (files: File[], renamedFiles: FileEntry[]): Promise<ClassifyResponse> => {
  let hasError = false;
  const messages: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('action', 'classement');
      formData.append('files', file);
      formData.append('nouveau_nom', renamedFiles[i].renamed);
      if (renamedFiles[i].type) {
        formData.append('type', renamedFiles[i].type);
      }

      toast.loading(`Classifying file ${i + 1} of ${files.length}...`, { id: `classify-${i}` });

      try {
        const response = await pRetry(
          async () => makeRequest(formData),
          {
            retries: 3,
            onFailedAttempt: error => {
              console.log(
                `Attempt ${error.attemptNumber} failed for file ${file.name}. ${error.retriesLeft} retries left.`
              );
            },
          }
        );

        const message = await response.text();
        messages.push(message);
        toast.success(`File ${i + 1} classified successfully!`, { id: `classify-${i}` });
      } catch (error) {
        console.error(`Error classifying file ${file.name}:`, error);
        hasError = true;
        toast.error(
          error instanceof Error 
            ? `Error classifying ${file.name}: ${error.message}` 
            : `Error classifying ${file.name}`,
          { id: `classify-${i}` }
        );
      }

      if (i < files.length - 1) {
        await delay(100);
      }
    }

    if (hasError) {
      return {
        success: false,
        error: 'Some files failed to classify'
      };
    }

    return {
      success: true,
      message: messages.join(' | ')
    };
  } catch (error) {
    console.error('Error in classify operation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};