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

// Initialize Appwrite client for browser-side uploads
// Note: For large file uploads (up to 5GB), the bucket must have:
// 1. File permissions set to allow "Any" or authenticated users to create files
// 2. Maximum file size set appropriately in bucket settings
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Only set API key if available (for server-side operations)
// Browser uploads will use bucket permissions instead
const apiKey = typeof import.meta !== 'undefined' 
  ? import.meta.env?.VITE_APPWRITE_API_KEY 
  : undefined;
  
if (apiKey) {
  client.setKey(apiKey);
}

export const appwriteStorage = new Storage(client);
export { ID as AppwriteID };

/**
 * Upload a file to Appwrite Storage with support for large files (up to 500MB).
 * The SDK automatically handles chunking for files larger than 5MB.
 * Returns the file ID which can be used to build the download/view URL.
 * 
 * IMPORTANT: For this to work with large files (200MB+), ensure:
 * 1. The Appwrite bucket "learning-resources" has maximum file size set to at least 500MB
 * 2. Bucket permissions allow file creation (set to "Any" or specific roles)
 */
export const uploadFileToAppwrite = async (
  file: File,
  bucketId: string = APPWRITE_BUCKETS.LEARNING_RESOURCES,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; fileUrl: string }> => {
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  console.log(`[Appwrite] Starting upload: ${file.name} (${fileSizeMB}MB)`);
  
  // Validate file size (500MB max)
  const MAX_SIZE_BYTES = 500 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`File is too large (${fileSizeMB}MB). Maximum allowed size is 500MB.`);
  }
  
  try {
    // Generate a unique file ID
    const fileId = ID.unique();
    
    // The Appwrite SDK automatically chunks files larger than 5MB
    // This enables upload of files up to 5GB with proper chunking
    const response = await appwriteStorage.createFile(
      bucketId,
      fileId,
      file,
      undefined, // permissions - use bucket defaults
      (progress) => {
        if (onProgress) {
          const percentage = Math.min(
            (progress.chunksUploaded / progress.chunksTotal) * 100,
            100
          );
          onProgress(percentage);
          
          // Log progress every 10%
          if (Math.floor(percentage) % 10 === 0) {
            console.log(`[Appwrite] Upload progress: ${percentage.toFixed(0)}% (chunk ${progress.chunksUploaded}/${progress.chunksTotal})`);
          }
        }
      }
    );

    console.log(`[Appwrite] Upload complete! File ID: ${response.$id}`);

    const fileUrl = getAppwriteFileViewUrl(bucketId, response.$id);
    return { fileId: response.$id, fileUrl };
  } catch (error: any) {
    console.error("[Appwrite] Upload failed:", error);
    
    // Provide more helpful error messages
    let errorMessage = "Failed to upload file. ";
    
    if (error?.message?.includes("permissions") || error?.code === 401) {
      errorMessage += "The storage bucket may not have proper permissions configured. Please contact an administrator.";
    } else if (error?.message?.includes("size") || error?.code === 400) {
      errorMessage += `The file may be too large. Maximum allowed size is 500MB, your file is ${fileSizeMB}MB.`;
    } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
      errorMessage += "Network error occurred. Please check your internet connection and try again.";
    } else if (error?.message?.includes("timeout")) {
      errorMessage += "Upload timed out. Please try again with a stable internet connection.";
    } else {
      errorMessage += error?.message || "Please check your connection and try again.";
    }
    
    throw new Error(errorMessage);
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
