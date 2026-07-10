import { useState } from "react";
import { api } from "../lib/api";
import { ProductCard } from "./ProductSearch";
import {
  UploadCloud,
  Sparkles,
  Trash2,
  RefreshCw,
  Compass,
  PackageX,
} from "lucide-react";

export default function ImageSearch() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleClearImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageSearchQuery("");
    setError(null);
    setResults([]);
  };

  const handleImageSearch = async (file) => {
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    setImageSearchQuery("");
    setResults([]);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/image-search", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        setResults(response.data.products || []);
        setImageSearchQuery(response.data.query || "");
      } else {
        throw new Error(response.data?.error?.message || "Failed to search products by image.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error?.message || err.message || "Failed to upload or analyze the image."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSearch(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="space-y-3">
          <span className="text-eyebrow">Discovery / 05</span>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-stone-100 tracking-tight">
            Image <span className="italic text-amber-400">Search.</span>
          </h2>
          <p className="text-stone-400 text-sm max-w-md">
            Upload a garment photo to analyze its attributes with Gemini Vision AI and search Typesense for visual matches.
          </p>
        </div>
        {(imagePreview || results.length > 0) && (
          <button onClick={handleClearImage} className="btn-ghost self-start md:self-auto text-red-400 hover:text-red-300 border-red-500/10">
            <Trash2 className="h-3.5 w-3.5" />
            Clear Search
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Upload dropzone or Preview card */}
        {!imagePreview && !loading && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? "border-amber-400 bg-amber-400/[0.02]"
                : "border-white/10 hover:border-white/20 bg-white/[0.01]"
            }`}
            onClick={() => document.getElementById("image-upload-input").click()}
          >
            <input
              id="image-upload-input"
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageSearch(e.target.files[0]);
                }
              }}
            />
            <div className="p-4 rounded-full bg-white/[0.03] border border-white/5 mb-4">
              <UploadCloud className="h-10 w-10 text-stone-400" />
            </div>
            <h4 className="text-lg font-semibold text-stone-200">
              Upload a garment image
            </h4>
            <p className="text-xs text-stone-500 mt-2 max-w-sm leading-relaxed">
              Drag and drop your JPEG, PNG or WebP file here, or click to browse. Max size 5MB.
            </p>
          </div>
        )}

        {loading && (
          <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6 border border-white/5">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-stone-200">
                Gemini Vision is analyzing garment...
              </h4>
              <p className="text-sm text-stone-500 max-w-xs leading-relaxed">
                Extracting style, fabric, print, pattern, color, and gender details to find the best visual matches.
              </p>
            </div>
          </div>
        )}

        {imagePreview && !loading && (
          <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 border border-white/10">
            <div className="relative h-36 w-36 rounded-2xl overflow-hidden bg-stone-900 border border-white/5 shrink-0">
              <img
                src={imagePreview}
                alt="Garment Preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
              <div>
                <span className="text-[10px] font-bold text-amber-400 tracking-[0.2em] uppercase block mb-1">
                  AI Visual Analysis Complete
                </span>
                <h4 className="text-xl font-semibold text-stone-100 line-clamp-2">
                  {imageSearchQuery || "Garment search query generated"}
                </h4>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <button
                  onClick={() => handleImageSearch(imageFile)}
                  className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Re-analyze
                </button>
                <button
                  onClick={handleClearImage}
                  className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-1.5 py-1.5 px-3 text-xs border-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300 text-sm font-medium">
            {error}
          </div>
        )}

        {results.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-stone-100 text-lg tracking-tight">
                Visually Similar Matches
              </h3>
              <span className="chip-accent">
                {results.length} {results.length === 1 ? "style" : "styles"} found
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((product) => (
                <ProductCard key={product.style_number} product={product} />
              ))}
            </div>
          </div>
        ) : (
          !loading && !error && imagePreview && (
            <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-3xl text-center space-y-4">
              <div className="p-4 rounded-full bg-white/[0.04] border border-white/5">
                <PackageX className="h-7 w-7 text-stone-500" />
              </div>
              <div>
                <h3 className="text-xl font-display font-semibold text-stone-100 tracking-tight">
                  No visual matches found
                </h3>
                <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  We analyzed the image successfully but couldn't locate matching items in the catalog.
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
