import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (imageUrl: string) => void;
  memberId: string;
  teamType: 'executive' | 'classRep' | 'press';
  memberName: string;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  memberId,
  teamType,
  memberName,
}: ImageUploadModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setError('Please select an image');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const file = fileInputRef.current.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${teamType}/${memberId}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('team-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('team-images')
        .getPublicUrl(fileName);

      onUploadSuccess(urlData.publicUrl);
      setPreview(null);
      setIsLoading(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Image</h2>
          <p className="text-sm text-gray-600">
            Upload image for <span className="font-semibold text-gray-900">{memberName}</span>
          </p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2 font-medium">Preview:</p>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border-2 border-green2"
            />
          </div>
        )}

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-green2 file:text-white
              hover:file:bg-green1
              file:cursor-pointer
              cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-2">Max 5MB • JPG, PNG, WebP</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isLoading || !preview}
            className="flex-1 px-4 py-3 bg-green2 text-white font-semibold rounded-lg hover:bg-green1 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
