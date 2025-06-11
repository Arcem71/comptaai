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
    throw new Error(`Erreur HTTP ${response.status}`);
  }

  return response;
};

const sanitizeFileName = (fileName: string): string => {
  return fileName
    // Normalize to remove diacritics (accents)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove any characters that are not alphanumeric, hyphens, underscores, or periods
    .replace(/[^a-zA-Z0-9\-_.]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

export const getFilePreviewUrl = async (path: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600);

    if (error) {
      console.error('Erreur lors de la génération de l\'URL signée :', error);
      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error('Aucune URL signée générée');
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Erreur dans getFilePreviewUrl :', error);
    throw new Error('Impossible de générer l\'URL de prévisualisation');
  }
};

export const cleanupStorage = async (): Promise<void> => {
  try {
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
      throw new Error('Échec du nettoyage du stockage');
    }

    const data = await response.json();
    toast.success(`Nettoyage réussi : ${data.deletedFiles?.length || 0} fichiers supprimés`);
  } catch (error) {
    console.error('Erreur lors du nettoyage du stockage :', error);
    toast.error('Erreur lors du nettoyage du stockage');
  }
};

const uploadToStorage = async (file: File, fileName: string): Promise<string> => {
  try {
    const sanitizedFileName = sanitizeFileName(fileName);
    const path = `uploads/${sanitizedFileName}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    if (!data?.path) {
      throw new Error('Aucun chemin retourné après le téléversement');
    }

    return data.path;
  } catch (error) {
    console.error('Erreur dans uploadToStorage :', error);
    throw new Error('Échec du téléversement du fichier');
  }
};

export const renameFiles = async (files: File[]): Promise<RenameResponse> => {
  const renamedFiles: FileEntry[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('action', 'renommage');
      formData.append('files', file);

      toast.loading(`Traitement du fichier ${i + 1} sur ${files.length}...`, { id: `rename-${i}` });

      try {
        const response = await pRetry(
          async () => makeRequest(formData),
          {
            retries: 3,
            onFailedAttempt: error => {
              console.log(
                `Tentative ${error.attemptNumber} échouée pour le fichier ${file.name}. ${error.retriesLeft} essais restants.`
              );
            },
          }
        );

        const webhookResponse: WebhookResponse = await response.json();

        if (webhookResponse.nouveau_nom) {
          let storagePath: string | undefined;
          
          try {
            storagePath = await uploadToStorage(file, webhookResponse.nouveau_nom);
          } catch (uploadError) {
            console.error('Erreur lors du téléversement :', uploadError);
            // Upload to storage with original filename as fallback
            try {
              storagePath = await uploadToStorage(file, file.name);
            } catch (fallbackError) {
              console.error('Erreur lors du téléversement de secours :', fallbackError);
            }
          }

          renamedFiles.push({
            original: file.name,
            renamed: webhookResponse.nouveau_nom,
            storagePath,
            type: webhookResponse.type
          });
          
          toast.success(`Fichier traité avec succès !`, { id: `rename-${i}` });
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file.name} :`, error);
        
        // Add file to renamed list even if renaming failed, using original name
        let storagePath: string | undefined;
        try {
          storagePath = await uploadToStorage(file, file.name);
        } catch (uploadError) {
          console.error('Erreur lors du téléversement de secours :', uploadError);
        }

        renamedFiles.push({
          original: file.name,
          renamed: file.name, // Use original name as renamed name
          storagePath
        });
        
        toast.success(`Erreur lors du renommage de ${file.name}, vous pouvez le renommer manuellement`, { id: `rename-${i}` });
      }

      if (i < files.length - 1) {
        await delay(100);
      }
    }

    // Always return success since we add all files to the list
    return {
      success: true,
      renamedFiles
    };
  } catch (error) {
    console.error('Erreur lors de l\'opération de traitement :', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
    };
  }
};

export const classifyFiles = async (files: File[], renamedFiles: FileEntry[]): Promise<ClassifyResponse> => {
  const messages: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('action', 'classement');
      formData.append('files', file);
      formData.append('nouveau_nom', renamedFiles[i].renamed);
      formData.append('ancien_nom', renamedFiles[i].original); // Ajout de l'ancien nom
      if (renamedFiles[i].type) {
        formData.append('type', renamedFiles[i].type);
      }

      toast.loading(`Classification du fichier ${i + 1} sur ${files.length}...`, { id: `classify-${i}` });

      try {
        const response = await pRetry(
          async () => makeRequest(formData),
          {
            retries: 3,
            onFailedAttempt: error => {
              console.log(
                `Tentative ${error.attemptNumber} échouée pour le fichier ${file.name}. ${error.retriesLeft} essais restants.`
              );
            },
          }
        );

        const responseText = await response.text();
        
        if (!responseText.trim()) {
          throw new Error('Erreur de classification');
        }

        messages.push(responseText);
        toast.success(`Fichier ${i + 1} classé avec succès !`, { id: `classify-${i}` });
      } catch (error) {
        console.error(`Erreur lors de la classification du fichier ${file.name} :`, error);
        return {
          success: false,
          error: `Erreur lors de la classification de ${file.name}`
        };
      }

      if (i < files.length - 1) {
        await delay(100);
      }
    }

    return {
      success: true,
      message: messages.join(' | ')
    };
  } catch (error) {
    console.error('Erreur lors de l\'opération de classification :', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
    };
  }
};