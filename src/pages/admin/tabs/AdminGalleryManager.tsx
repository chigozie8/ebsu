import { useState, useEffect, useRef } from "react";
import { IoTrash, IoImages, IoVideocam, IoClose, IoCloudUpload, IoRefresh } from "react-icons/io5";
import { notifyUser } from "../../../helpers/notifyUser";

export interface GalleryItem {
  url: string;
  pathname: string;
  category: string;
  type: "image" | "video";
  uploadedAt: string;
  size?: number;
}

const CATEGORIES = [
  { value: "general",      label: "General" },
  { value: "events",       label: "Events" },
  { value: "activities",   label: "Activities" },
  { value: "convocation",  label: "Convocation" },
  { value: "outreach",     label: "Outreach" },
  { value: "executives",   label: "Executives" },
];

/** Compress image client-side to max 1400px, JPEG 0.85 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1400;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => { blob ? resolve(blob) : reject(new Error("Compression failed")); },
        "image/jpeg", 0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Load failed")); };
    img.src = objectUrl;
  });
}

export default function AdminGalleryManager() {
  const [items, setItems]           = useState<GalleryItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [caption, setCaption]       = useState("");
  const [category, setCategory]     = useState("general");
  const [preview, setPreview]       = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterCategory, setFilterCategory] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery-list");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      notifyUser("error", "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isVideo) { notifyUser("error", "Select an image or video file"); return; }
    if (file.size > 100 * 1024 * 1024) { notifyUser("error", "File must be under 100 MB"); return; }
    setSelectedFile(file);
    setPreview({ url: URL.createObjectURL(file), type: isVideo ? "video" : "image" });
  };

  const clearSelection = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null); setSelectedFile(null); setCaption(""); setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      let blob: Blob = selectedFile;
      if (preview.type === "image") {
        try { blob = await compressImage(selectedFile); } catch { /* use original */ }
      }
      setUploadProgress(40);
      const formData = new FormData();
      formData.append("file", blob, selectedFile.name);
      formData.append("caption", caption.trim());
      formData.append("category", category);
      setUploadProgress(60);
      const res = await fetch("/api/gallery-upload", { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Upload failed"); }
      setUploadProgress(100);
      notifyUser("success", "Uploaded to gallery!");
      clearSelection();
      await fetchItems();
    } catch (err) {
      notifyUser("error", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(`Delete this ${item.type}? This cannot be undone.`)) return;
    setDeletingUrl(item.url);
    try {
      const res = await fetch("/api/gallery-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((i) => i.url !== item.url));
      notifyUser("success", "Deleted successfully");
    } catch {
      notifyUser("error", "Failed to delete item");
    } finally {
      setDeletingUrl(null);
    }
  };

  const filtered = filterCategory === "all" ? items : items.filter((i) => i.category === filterCategory);
  const totalSize = items.reduce((acc, i) => acc + (i.size || 0), 0);
  const formatSize = (bytes: number) => bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${(bytes / 1e3).toFixed(0)} KB`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gallery Manager</h2>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} items &middot; {formatSize(totalSize)} total &mdash; stored on Vercel Blob
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green2 transition-colors"
        >
          <IoRefresh className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="font-semibold text-gray-800 text-base">Upload New Media</h3>

        {/* Category + Caption row */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green2/30 focus:border-green2 transition-colors bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="E.g. EBSUMSA Week 2025"
              maxLength={120}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green2/30 focus:border-green2 transition-colors"
            />
          </div>
        </div>

        {/* Drop zone / preview */}
        {preview ? (
          <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video max-w-md">
            {preview.type === "video" ? (
              <video src={preview.url} controls className="w-full h-full object-contain" />
            ) : (
              <img src={preview.url} alt="Preview" className="w-full h-full object-contain" />
            )}
            <button onClick={clearSelection} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors" aria-label="Remove selection">
              <IoClose />
            </button>
          </div>
        ) : (
          <label htmlFor="gallery-upload-input" className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-green2 hover:bg-green2/5 transition-colors">
            <div className="flex gap-4">
              <IoImages className="text-4xl text-gray-300" />
              <IoVideocam className="text-4xl text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">Click to choose a photo or video</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP, MP4, MOV — max 100 MB</p>
          </label>
        )}

        <input id="gallery-upload-input" ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="sr-only" />

        {/* Progress bar */}
        {uploading && uploadProgress > 0 && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        <div className="flex gap-3">
          {preview && (
            <button onClick={clearSelection} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}
          <button
            onClick={preview ? handleUpload : () => fileRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green2 text-white text-sm font-semibold rounded-xl hover:bg-green1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Uploading...</>
            ) : (
              <><IoCloudUpload className="text-base" />{preview ? "Upload to Gallery" : "Choose File"}</>
            )}
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterCategory === "all" ? "bg-green2 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          All ({items.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = items.filter((i) => i.category === c.value).length;
          if (count === 0) return null;
          return (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterCategory === c.value ? "bg-green2 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-white rounded-2xl border border-gray-100">
          <IoImages className="text-4xl text-gray-300" />
          <p className="text-sm text-gray-500">No gallery items yet. Upload your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <div key={item.url} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {item.type === "video" ? (
                <>
                  <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 rounded-full p-2"><IoVideocam className="text-white text-sm" /></div>
                  </div>
                </>
              ) : (
                <img src={item.url} alt="Gallery" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              )}
              {/* Category badge */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize">
                  {item.category}
                </span>
              </div>
              {/* Delete */}
              <button
                onClick={() => handleDelete(item)}
                disabled={deletingUrl === item.url}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-all shadow-md disabled:opacity-50"
                aria-label="Delete"
              >
                {deletingUrl === item.url ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                ) : (
                  <IoTrash className="text-xs" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
