/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { supabase, STORAGE_BUCKETS, getPublicUrl } from "../../config/supabase";
import { FileMetadata } from "../../models/academics/learning-resources";

export const useLearningResources = () => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [gettingResources, setGettingResources] = useState(false);
  const [error, setError] = useState(false);

  const getLearningResources = async (
    level: string,
    course: string,
    resourcesType: string
  ) => {
    const folderPath = `levels/${level}/${course}/${resourcesType}`;
    
    try {
      setError(false);
      setGettingResources(true);
      
      // List files from Supabase Storage
      const { data, error: listError } = await supabase.storage
        .from(STORAGE_BUCKETS.LEARNING_RESOURCES)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (listError) {
        throw listError;
      }

      // Map files to FileMetadata format
      const fileList: FileMetadata[] = (data || [])
        .filter(item => item.name && !item.name.startsWith('.')) // Filter out hidden files
        .map((item) => ({
          name: item.name,
          path: `${folderPath}/${item.name}`,
          size: item.metadata?.size || 0,
          url: getPublicUrl(STORAGE_BUCKETS.LEARNING_RESOURCES, `${folderPath}/${item.name}`),
        }));

      setFiles(fileList);
      setGettingResources(false);
      console.log(fileList);
    } catch (error: any) {
      setError(error);
      setGettingResources(false);
      console.error("Error fetching files:", error);
    }
  };

  // Helper function to download a file
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.LEARNING_RESOURCES)
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  };

  return { getLearningResources, files, gettingResources, error, downloadFile };
};
