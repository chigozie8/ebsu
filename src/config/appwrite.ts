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

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const appwriteStorage = new Storage(client);
export { ID as AppwriteID };

/**
 * Upload a file to Appwrite Storage.
 * Returns the file ID which can be used to build the download/view URL.
 */
export const uploadFileToAppwrite = async (
  file: File,
  bucketId: string = APPWRITE_BUCKETS.LEARNING_RESOURCES
): Promise<{ fileId: string; fileUrl: string }> => {
  const response = await appwriteStorage.createFile(
    bucketId,
    ID.unique(),
    file
  );

  const fileUrl = getAppwriteFileViewUrl(bucketId, response.$id);
  return { fileId: response.$id, fileUrl };
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
  await appwriteStorage.deleteFile(bucketId, fileId);
};

export { client as appwriteClient };
