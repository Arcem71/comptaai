import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // First, ensure the uploads folder exists
    const emptyFile = new Uint8Array(0);
    await supabase.storage
      .from('documents')
      .upload('uploads/.keep', emptyFile, {
        upsert: true
      });

    // Get all files in the uploads directory
    const { data: uploadFiles, error: uploadListError } = await supabase
      .storage
      .from('documents')
      .list('uploads');

    if (uploadListError) {
      throw uploadListError;
    }

    // Filter out any directory entries and the .keep file
    const filesToDelete = (uploadFiles || [])
      .filter(f => !f.metadata?.isDir && f.name !== '.keep');

    if (filesToDelete.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files to clean up' }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Create paths for all files in uploads directory
    const filePaths = filesToDelete.map(f => `uploads/${f.name}`);

    // Delete only the files, not the directory or .keep file
    const { error: deleteError } = await supabase
      .storage
      .from('documents')
      .remove(filePaths);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully cleaned up ${filePaths.length} files`,
        deletedFiles: filePaths
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});