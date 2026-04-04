import { Client, Storage, ID } from "appwrite";

// Appwrite configuration — hardcoded credentials for EBSUMSA
const APPWRITE_ENDPOINT = "https://sfo.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "69d0104f0024b77cfd50";

export const APPWRITE_PROJECT_NAME = "Ebsumsa";

// Appwrite bucket IDs — create these in your Appwrite console
export const APPWRITE_BUCKETS = {
  LEARNING_RESOURCES: "learning-resources",
  STUDY_MATERIALS: "study-materials",
} as const;

// Initialize Appwrite client with timeout for large file uploads
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(import.meta.env.VITE_APPWRITE_API_KEY || "");

export const appwriteStorage = new Storage(client);
export { ID as AppwriteID };

/**
 * Upload a file to Appwrite Storage with support for large files (up to 5GB).
 * The SDK automatically handles chunking for files larger than 5MB.
 * Returns the file ID which can be used to build the download/view URL.
 */
export const uploadFileToAppwrite = async (
  file: File,
  bucketId: string = APPWRITE_BUCKETS.LEARNING_RESOURCES,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; fileUrl: string }> => {
  try {
    console.log("[v0] Starting upload for file:", file.name, "Size:", file.size, "bytes");
    
    // The Appwrite SDK automatically chunks files larger than 5MB
    // and handles the upload process. Max file size is 5GB.
    const response = await appwriteStorage.createFile(
      bucketId,
      ID.unique(),
      file,
      [],
      (progress) => {
        if (onProgress) {
          const percentage = (progress.bytesUploaded / progress.bytesTotal) * 100;
          onProgress(percentage);
          console.log(`[v0] Upload progress: ${percentage.toFixed(2)}%`);
        }
      }
    );

    console.log("[v0] File uploaded successfully with ID:", response.$id);

    const fileUrl = getAppwriteFileViewUrl(bucketId, response.$id);
    return { fileId: response.$id, fileUrl };
  } catch (error: any) {
    console.error("[v0] Upload error:", error);
    throw new Error(
      error?.message || "Failed to upload file. Please check your connection and try again."
    );
  }
};

/**
 * Get a public view URL for an Appwrite file.
 */
export const getAppwriteFileViewUrl = (bucketId: string, fileId: string): string => {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
};

/**
 * Get a download URL for an Appwrite file.
 */
export const getAppwriteFileDownloadUrl = (bucketId: string, fileId: string): string => {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/download?project=${APPWRITE_PROJECT_ID}`;
};

/**
 * Delete a file from Appwrite Storage.
 */
export const deleteFileFromAppwrite = async (
  bucketId: string,
  fileId: string
): Promise<void> => {
  try {
    await appwriteStorage.deleteFile(bucketId, fileId);
    console.log("[v0] File deleted successfully:", fileId);
  } catch (error: any) {
    console.error("[v0] Delete error:", error);
    throw new Error(error?.message || "Failed to delete file.");
  }
};

export { client as appwriteClient };
