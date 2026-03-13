import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface UseImageUploadOptions {
  teamType: 'executive' | 'classRep' | 'press';
  memberId: string;
}

export function useImageUpload({ teamType, memberId }: UseImageUploadOptions) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${teamType}/${memberId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('team-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('team-images')
        .getPublicUrl(fileName);

      setImageUrl(data.publicUrl);
      return data.publicUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [teamType, memberId, supabase]);

  const clearError = useCallback(() => setError(null), []);
  const resetImage = useCallback(() => setImageUrl(null), []);

  return {
    imageUrl,
    isUploading,
    error,
    uploadImage,
    clearError,
    resetImage,
  };
}
