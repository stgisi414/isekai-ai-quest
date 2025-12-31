import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth } from "./firebase";

/**
 * Uploads a base64 image string to Firebase Storage and returns the download URL.
 * Path format: users/{uid}/images/{randomId}.png
 */
export const uploadBase64Image = async (base64String: string, folder: string = "general"): Promise<string> => {
  if (!auth.currentUser) throw new Error("Authentication required for image upload");
  if (!base64String.startsWith("data:image")) return base64String; // Already a URL

  try {
    const uid = auth.currentUser.uid;
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const storageRef = ref(storage, `users/${uid}/${folder}/${fileName}`);

    // uploadString handles the data:image/png;base64, prefix automatically if format is 'data_url'
    await uploadString(storageRef, base64String, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to storage:", error);
    return base64String; // Fallback to base64 if upload fails (though this may still hit Firestore limits)
  }
};

/**
 * Deletes an image from Firebase Storage using its download URL.
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl || !imageUrl.startsWith('http')) return; // Ignore base64 or invalid urls
  if (!imageUrl.includes('firebasestorage.googleapis.com')) return; // Ignore external URLs (e.g. placeholders)
  
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error: any) {
    // Ignore "Object not found" errors, as the file might already be gone
    if (error.code !== 'storage/object-not-found') {
      console.error("Error deleting image from storage:", error);
    }
  }
};