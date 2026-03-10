/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { notifyUser } from "../../helpers/notifyUser";
import { db } from "../../config/firebase";
import { useGetUserInfo } from "../../hooks/auth/useGetUserInfo";
import { updateDoc, doc } from "firebase/firestore";
import { useModalContext } from "../../context/Modal";
import { imagekitConfig, getImageKitAuthParams } from "../../config/imagekit";

export const useUploadProfileImage = () => {
  const { studentDetails, userID } = useGetUserInfo();
  const { setOpenDeleteProfileImageModal } = useModalContext();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [imageFileID, setImageFileID] = useState<string | null>(null);
  const [deletingProfileImage, setDeletingProfileImage] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setImageFile(selectedFile);
      setUploadProgress(0);
      // Create local preview URL immediately when file is selected
      const localPreviewURL = URL.createObjectURL(selectedFile);
      setImageURL(localPreviewURL);
    } else {
      notifyUser(
        "error",
        "Please choose a valid image file (PNG, JPG or WEBP)."
      );
      e.target.value = "";
    }
  };

  const uploadProfileImage = async () => {
    if (!imageFile) {
      notifyUser("error", "Please select an image to upload.");
      return;
    }
    if (userID) {
      try {
        notifyUser("loading", "Uploading Image");

        // Get authentication parameters from our API
        const authParams = await getImageKitAuthParams();

        // Create form data for ImageKit upload
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("publicKey", imagekitConfig.publicKey);
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire.toString());
        formData.append("token", authParams.token);
        formData.append(
          "fileName",
          `${studentDetails?.email}-${userID}-${Date.now()}`
        );
        formData.append("folder", `/profile-pictures/${userID}`);

        // Upload to ImageKit
        const uploadResponse = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image to ImageKit");
        }

        const uploadResult = await uploadResponse.json();
        const downloadURL = uploadResult.url;
        const fileId = uploadResult.fileId;

        setImageURL(downloadURL);
        setImageFileID(fileId);

        // Automatically save to Firestore so image persists
        await updateDoc(doc(db, "userInfo", userID), {
          profileImageURL: downloadURL,
          profileImageID: fileId,
        });

        notifyUser("success", "Image Uploaded");
      } catch (error: any) {
        console.error("ImageKit upload error:", error);
        notifyUser("error", "Failed to upload image. Please try again.");
        setUploadError(error);
      }
    }
  };

  const updateUserProfileLink = async () => {
    if (userID && imageURL && imageURL.length > 1) {
      try {
        await updateDoc(doc(db, "userInfo", userID), {
          profileImageURL: imageURL,
          profileImageID: imageFileID,
        });
        console.log("Done");
        console.log(imageURL);
        // notifyUser("success", "Image Updated");
        setImageFile(null);
      } catch (err) {
        console.log("Error updating doc");
        notifyUser("error", "Sorry couldn't update profile picture");
      }
    }
  };

  const deleteUserProfileImage = async () => {
    if (userID && studentDetails) {
      try {
        setDeletingProfileImage(true);

        // Clear the profile image reference in Firestore
        await updateDoc(doc(db, "userInfo", userID), {
          profileImageURL: "",
          profileImageID: "",
        });

        setDeletingProfileImage(false);
        setOpenDeleteProfileImageModal(false);
        notifyUser("success", "Profile picture deleted");
      } catch (err) {
        console.error("Error deleting profile image:", err);
        notifyUser("error", "Something went wrong. Please try again");
        setOpenDeleteProfileImageModal(false);
        setDeletingProfileImage(false);
      }
    }
  };

  return {
    setImageFile,
    setImageFileID,
    imageFile,
    imageURL,
    uploadProgress,
    uploadError,
    setUploadProgress,
    uploadProfileImage,
    handleFileChange,
    updateUserProfileLink,
    deleteUserProfileImage,
    setImageURL,
    deletingProfileImage,
  };
};
