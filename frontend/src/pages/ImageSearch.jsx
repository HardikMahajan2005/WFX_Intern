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
  Search,
} from "lucide-react";

export default function ImageSearch() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [textQuery, setTextQuery] = useState("");
  const [searchedTerm, setSearchedTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleClear = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageSearchQuery("");
    setTextQuery("");
    setSearchedTerm("");
    setError(null);
    setResults([]);
  };

  const handleTextSearch = async (e) => {
    if (e) e.preventDefault();
    if (!textQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    // Clear image-related states
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageSearchQuery("");
    setSearchedTerm(textQuery.trim());

    try {
      const response = await api.get("/search/text", {
        params: {
          q: textQuery.trim(),
          limit: 12,
        },
      });

      const products = response.data?.data || [];
      setResults(products);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error?.message || "Failed to search products by text."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageSearch = async (file) => {
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    setImageSearchQuery("");
    setResults([]);
    setTextQuery("");
    setSearchedTerm("");

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
          <span className="text-eyebrow">Discovery</span>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-stone-100 tracking-tight">
            Image <span className="italic text-amber-400">Search.</span>
          </h2>
          <p className="text-stone-400 text-sm max-w-md">
            Search using natural language or upload a garment photo to analyze it with Gemini Vision and locate visual matches.
          </p>
        </div>
        {(imagePreview || results.length > 0 || searchedTerm) && (
          <button onClick={handleClear} className="btn-ghost self-start md:self-auto text-red-400 hover:text-red-300 border-red-500/10">
            <Trash2 className="h-3.5 w-3.5" />
            Clear Search
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
        {/* Search controls */}
        <div className="space-y-6">
          {/* Text Search Options */}
          <form onSubmit={handleTextSearch} className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-eyebrow">Search using natural language</span>
              <p className="text-xs text-stone-500 leading-relaxed">
                Describe the style, color, fabric, or features of the garment you are looking for.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 group-focus-within:text-amber-400 transition-colors" />
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="Describe your search (e.g. blue floral dress, black oversized hoodie)..."
                  className="w-full bg-[#0a0e1a]/60 border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/5 transition-all font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !textQuery.trim()}
                className="btn-primary px-6"
              >
                Search
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">Or</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Image Search Option */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-eyebrow">Search using an image</span>
              <p className="text-xs text-stone-500 leading-relaxed">
                Upload or drag a garment photo to perform a visual similarity search.
              </p>
            </div>

            {/* Upload dropzone or Preview card */}
            {!imagePreview && !loading && (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
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
                <div className="p-3 rounded-full bg-white/[0.03] border border-white/5 mb-3">
                  <UploadCloud className="h-8 w-8 text-stone-400" />
                </div>
                <h5 className="text-sm font-semibold text-stone-300">
                  Drag & drop or click to upload
                </h5>
                <p className="text-[11px] text-stone-500 mt-1 max-w-xs leading-relaxed">
                  JPEG, PNG or WebP files up to 5MB.
                </p>
              </div>
            )}

            {loading && imageFile && (
              <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 border border-white/5 bg-white/[0.01]">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-amber-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-semibold text-stone-200">
                    Gemini Vision is analyzing garment...
                  </h5>
                  <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                    Extracting style, fabric, print, pattern, color, and gender details to find the best visual matches.
                  </p>
                </div>
              </div>
            )}

            {imagePreview && !loading && (
              <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-white/8 bg-[#0a0e1a]/40">
                <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-stone-900 border border-white/5 shrink-0">
                  <img
                    src={imagePreview}
                    alt="Garment Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3 text-center sm:text-left min-w-0">
                  <div>
                    <span className="text-[9px] font-bold text-amber-400 tracking-[0.2em] uppercase block mb-0.5">
                      AI Visual Analysis Complete
                    </span>
                    <h4 className="text-sm font-semibold text-stone-100 line-clamp-1">
                      {imageSearchQuery || "Garment search query generated"}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      onClick={() => handleImageSearch(imageFile)}
                      className="btn-ghost flex items-center gap-1.5 py-1 px-2.5 text-[11px]"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Re-analyze
                    </button>
                    <button
                      onClick={handleClear}
                      className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-1.5 py-1 px-2.5 text-[11px] border-red-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar examples & stats */}
        <aside className="glass-panel rounded-3xl p-6 border border-white/5 space-y-5">
          <h4 className="font-display font-semibold text-stone-100 text-base tracking-tight flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Try Natural Language
          </h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            Our AI-powered search allows you to write descriptive prompts instead of exact keywords. Here are some examples:
          </p>
          <div className="space-y-2.5">
            {[
              "Blue floral dress",
              "Black oversized hoodie",
              "Cotton polo t-shirt",
              "Classic indigo denim jacket",
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setTextQuery(example);
                  // Trigger search immediately
                  const fakeEvent = { preventDefault: () => {} };
                  // We need to set state and call search, but since state updates are batching, we call it directly
                  setLoading(true);
                  setError(null);
                  setResults([]);
                  setImageFile(null);
                  if (imagePreview) {
                    URL.revokeObjectURL(imagePreview);
                  }
                  setImagePreview(null);
                  setImageSearchQuery("");
                  setSearchedTerm(example);
                  api.get("/search/text", { params: { q: example, limit: 12 } })
                    .then((response) => {
                      setResults(response.data?.data || []);
                    })
                    .catch((err) => {
                      setError(err.response?.data?.error?.message || "Failed to search.");
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }}
                className="w-full text-left p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.04] transition-all text-xs font-mono font-medium text-stone-300 hover:text-stone-100 cursor-pointer"
              >
                {example}
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* Loader for general search */}
      {loading && !imageFile && (
        <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 border border-white/5 bg-white/[0.01]">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
            <Search className="absolute inset-0 m-auto h-5 w-5 text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-semibold text-stone-200">
              Searching finished goods...
            </h5>
            <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
              Searching the database for visual and category matches to your query.
            </p>
          </div>
        </div>
      )}

      {/* Results grid */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300 text-sm font-medium">
          {error}
        </div>
      )}

      {results.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-stone-100 text-lg tracking-tight">
              {imagePreview ? "Visually Similar Matches" : `Search Results for "${searchedTerm}"`}
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
        !loading && !error && (imagePreview || searchedTerm) && (
          <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-3xl text-center space-y-4">
            <div className="p-4 rounded-full bg-white/[0.04] border border-white/5">
              <PackageX className="h-7 w-7 text-stone-500" />
            </div>
            <div>
              <h3 className="text-xl font-display font-semibold text-stone-100 tracking-tight">
                No visual matches found
              </h3>
              <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
                {imagePreview
                  ? "We analyzed the image successfully but couldn't locate matching items in the catalog."
                  : `We couldn't locate any matching items in the catalog for "${searchedTerm}".`}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
