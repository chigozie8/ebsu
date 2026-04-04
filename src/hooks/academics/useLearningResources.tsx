import { useState } from "react";
import { FileMetadata } from "../../models/academics/learning-resources";
import { db, isFirebaseConfigured } from "../../config/firebase";
import { collection, getDocs, query, where, and } from "firebase/firestore";
import { cachedFetch } from "../../lib/cache";
import { getAppwriteFileDownloadUrl, APPWRITE_BUCKETS } from "../../config/appwrite";

interface AdminMaterial {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  courseCode: string;
  level: string;
  semester: string;
  resourceType: string;
}

export const useLearningResources = () => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [gettingResources, setGettingResources] = useState(false);
  const [error, setError] = useState(false);

  const getLearningResources = async (
    level: string,
    course: string,
    resourcesType: string
  ) => {
    const cacheKey = `resources:${level}:${course}:${resourcesType}`;

    try {
      setError(false);
      setGettingResources(true);

      // Return instantly from cache if available (TTL: 10 minutes)
      const cached = await cachedFetch<FileMetadata[]>(
        cacheKey,
        async () => {
          let fileList: FileMetadata[] = [];

          // Fetch from Firestore (admin-uploaded materials with Appwrite storage)
          if (isFirebaseConfigured) {
            try {
              const q = query(
                collection(db, "learningMaterials"),
                and(
                  where("level", "==", level),
                  where("courseCode", "==", course),
                  where("resourceType", "==", resourcesType)
                )
              );
              const snapshot = await getDocs(q);
              const adminMaterials = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              })) as AdminMaterial[];

              adminMaterials.forEach((material) => {
                fileList.push({
                  name: material.title || material.fileName,
                  path: material.filePath,
                  size: material.fileSize || 0,
                  url: material.fileUrl,
                  description: material.description,
                });
              });
            } catch (firestoreError) {
              console.error("Error fetching from Firestore:", firestoreError);
            }
          }

          return fileList;
        },
        10 * 60 * 1000 // 10 minute TTL
      );

      setFiles(cached);
      setGettingResources(false);
    } catch (error: unknown) {
      setError(error as boolean);
      setGettingResources(false);
      console.error("Error fetching files:", error);
    }
  };

  // Helper function to download a file
  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const downloadUrl = getAppwriteFileDownloadUrl(
        APPWRITE_BUCKETS.LEARNING_RESOURCES,
        fileId
      );

      // Create a download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  };

  return { getLearningResources, files, gettingResources, error, downloadFile };
};
