import { useState, useEffect, useRef } from "react";
import { db } from "../../../config/firebase";
import { supabase } from "../../../config/supabase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { IoTrash, IoImages, IoVideocam, IoClose, IoCloudUpload } from "react-icons/io5";
import { notifyUser } from "../../../helpers/notifyUser";

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  filePath?: string;
  createdAt?: number;
}

/** Compress an image to max 1200px, JPEG 0.82 quality */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { blob ? resolve(blob) : reject(new Error("Compression failed")); },
        "image/jpeg",
        0.82
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Load failed")); };
    img.src = objectUrl;
  });
}

export default function AdminGalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "galleryImages"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, "id">) }))
      );
    } catch {
      notifyUser("error", "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      notifyUser("error", "Please select an image or video file");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      notifyUser("error", "File must be under 100 MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview({ url: objectUrl, type: isVideo ? "video" : "image" });
  };

  const clearSelection = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setSelectedFile(null);
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) return;
    setUploading(true);

    try {
      let uploadBlob: Blob = selectedFile;

      if (preview.type === "image") {
        try { uploadBlob = await compressImage(selectedFile); } catch { /* use original */ }
      }

      const ext = preview.type === "video" ? selectedFile.name.split(".").pop() || "mp4" : "jpg";
      const filePath = `gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, uploadBlob, {
          upsert: false,
          contentType: preview.type === "video" ? selectedFile.type : "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      await addDoc(collection(db, "galleryImages"), {
        url: urlData.publicUrl,
        type: preview.type,
        caption: caption.trim() || null,
        filePath,
        createdAt: serverTimestamp(),
      });

      notifyUser("success", "Media uploaded to gallery!");
      clearSelection();
      fetchItems();
    } catch (err) {
      notifyUser("error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(`Delete this ${item.type}? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      // Remove from Supabase storage
      if (item.filePath) {
        await supabase.storage.from("profile-pictures").remove([item.filePath]);
      }
      // Remove from Firestore
      await deleteDoc(doc(db, "galleryImages", item.id));
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      notifyUser("success", "Deleted successfully");
    } catch {
      notifyUser("error", "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Gallery Manager</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos and videos that appear in the home page gallery section.
        </p>
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="font-semibold text-gray-800 text-base">Upload New Media</h3>

        {/* Drop zone / preview */}
        {preview ? (
          <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video max-w-md">
            {preview.type === "video" ? (
              <video
                src={preview.url}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={preview.url}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}
            <button
              onClick={clearSelection}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
              aria-label="Remove selection"
            >
              <IoClose className="text-sm" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="gallery-upload-input"
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-green2 hover:bg-green2/5 transition-colors"
          >
            <div className="flex gap-4">
              <IoImages className="text-4xl text-gray-300" />
              <IoVideocam className="text-4xl text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">Click to choose a photo or video</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP, MP4, MOV — max 100 MB</p>
          </label>
        )}

        <input
          id="gallery-upload-input"
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="sr-only"
        />

        {/* Caption */}
        {preview && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="E.g. Convocation 2025"
              maxLength={120}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green2/30 focus:border-green2 transition-colors"
            />
          </div>
        )}

        <div className="flex gap-3">
          {preview && (
            <button
              onClick={clearSelection}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={preview ? handleUpload : () => fileRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green2 text-white text-sm font-semibold rounded-xl hover:bg-green1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <IoCloudUpload className="text-base" />
                {preview ? "Upload to Gallery" : "Choose File"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Existing items */}
      <div>
        <h3 className="font-semibold text-gray-800 text-base mb-4">
          Gallery Items ({items.length})
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-white rounded-2xl border border-gray-100">
            <IoImages className="text-4xl text-gray-300" />
            <p className="text-sm text-gray-500">No gallery items yet. Upload your first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
              >
                {item.type === "video" ? (
                  <>
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/50 rounded-full p-2">
                        <IoVideocam className="text-white text-sm" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption || "Gallery"}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Caption overlay */}
                {item.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
                    <p className="text-white text-xs truncate">{item.caption}</p>
                  </div>
                )}

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-all shadow-md disabled:opacity-50"
                  aria-label="Delete"
                >
                  {deletingId === item.id ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <IoTrash className="text-xs" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
