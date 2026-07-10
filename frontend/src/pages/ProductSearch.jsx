import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import {
  Search,
  SlidersHorizontal,
  PackageX,
  Compass,
  ArrowUpRight,
  Sliders,
} from "lucide-react";

export default function ProductSearch() {
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFabric, setSelectedFabric] = useState("");
  const [selectedPrint, setSelectedPrint] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  const [gsmMin, setGsmMin] = useState(0);
  const [gsmMax, setGsmMax] = useState(500);
  const [gsmRange, setGsmRange] = useState({ min: 0, max: 500 });

  const [options, setOptions] = useState({
    categories: [],
    fabrics: [],
    colors: [],
    prints: [],
    seasons: [],
    brands: [],
    suppliers: [],
    buyers: [],
    gsmRange: { min_gsm: 0, max_gsm: 500 },
  });

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await api.get("/finished-goods/filters/options");
        const data = response.data?.data;
        if (data) {
          setOptions(data);
          const min = data.gsmRange?.min_gsm ?? 0;
          const max = data.gsmRange?.max_gsm ?? 500;
          setGsmRange({ min, max });
          setGsmMin(min);
          setGsmMax(max);
        }
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };
    fetchOptions();
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/search/text", {
        params: {
          q: q.trim() || undefined,
          category: selectedCategory || undefined,
          fabric: selectedFabric || undefined,
          color: selectedColor || undefined,
          print: selectedPrint || undefined,
          season: selectedSeason || undefined,
          brand: selectedBrand || undefined,
          supplier_id: selectedSupplierId || undefined,
          gsm_min: gsmMin !== gsmRange.min ? gsmMin : undefined,
          gsm_max: gsmMax !== gsmRange.max ? gsmMax : undefined,
          page,
          limit: 9,
        },
      });

      setResults(response.data?.data || []);
      setTotal(response.data?.pagination?.total || 0);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || "Failed to retrieve search results.");
    } finally {
      setLoading(false);
    }
  }, [
    q, selectedCategory, selectedFabric, selectedColor, selectedPrint,
    selectedSeason, selectedBrand, selectedSupplierId, gsmMin, gsmMax,
    gsmRange, page
  ]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [
    q, selectedCategory, selectedFabric, selectedColor, selectedPrint,
    selectedSeason, selectedBrand, selectedSupplierId, gsmMin, gsmMax,
    page, fetchResults
  ]);

  const handleFilterChange = (setter, val) => {
    setter(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setQ("");
    setSelectedCategory("");
    setSelectedFabric("");
    setSelectedPrint("");
    setSelectedColor("");
    setSelectedSeason("");
    setSelectedBrand("");
    setSelectedSupplierId("");
    setGsmMin(gsmRange.min);
    setGsmMax(gsmRange.max);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="space-y-3">
          <span className="text-eyebrow">Discovery</span>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-stone-100 tracking-tight">
            Search the <span className="italic text-amber-400">catalog.</span>
          </h2>
          <p className="text-stone-400 text-sm max-w-md">
            Typo-tolerant full-text search across the entire WFX garment catalog, with multi-dimensional filters.
          </p>
        </div>
        <button onClick={handleResetFilters} className="btn-ghost self-start md:self-auto">
          <Sliders className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Filter sidebar */}
        <aside className="lg:sticky lg:top-24 glass-panel rounded-2xl p-6 max-h-[calc(100vh-14rem)] overflow-y-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h3 className="font-display font-semibold text-stone-100 text-base tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-400" />
              Refine
            </h3>
            <span className="chip-accent">
              {total} {total === 1 ? "style" : "styles"}
            </span>
          </div>

          <FilterSelect
            label="Category"
            value={selectedCategory}
            onChange={(v) => handleFilterChange(setSelectedCategory, v)}
            options={options.categories}
            placeholder="All Categories"
          />

          <FilterSelect
            label="Fabric"
            value={selectedFabric}
            onChange={(v) => handleFilterChange(setSelectedFabric, v)}
            options={options.fabrics}
            placeholder="All Fabrics"
          />

          <FilterSelect
            label="Color"
            value={selectedColor}
            onChange={(v) => handleFilterChange(setSelectedColor, v)}
            options={options.colors}
            placeholder="All Colors"
          />

          <FilterSelect
            label="Print Type"
            value={selectedPrint}
            onChange={(v) => handleFilterChange(setSelectedPrint, v)}
            options={options.prints}
            placeholder="All Prints"
          />

          <FilterSelect
            label="Season"
            value={selectedSeason}
            onChange={(v) => handleFilterChange(setSelectedSeason, v)}
            options={options.seasons}
            placeholder="All Seasons"
          />

          <FilterSelect
            label="Supplier"
            value={selectedSupplierId}
            onChange={(v) => handleFilterChange(setSelectedSupplierId, v)}
            options={options.suppliers.map((s) => ({ value: s.supplier_id, label: s.company_name }))}
            placeholder="All Suppliers"
          />

          {/* GSM range */}
          <div className="space-y-3 pt-5 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-eyebrow-muted">GSM Weight</span>
              <span className="text-xs font-mono font-semibold text-amber-400 text-numeral">
                {gsmMin}–{gsmMax}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-stone-500 block font-semibold mb-1.5">
                  Min
                </span>
                <input
                  type="range"
                  min={gsmRange.min}
                  max={gsmRange.max}
                  value={gsmMin}
                  onChange={(e) => handleFilterChange(setGsmMin, parseInt(e.target.value))}
                  className="input-range"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block font-semibold mb-1.5">
                  Max
                </span>
                <input
                  type="range"
                  min={gsmRange.min}
                  max={gsmRange.max}
                  value={gsmMax}
                  onChange={(e) => handleFilterChange(setGsmMax, parseInt(e.target.value))}
                  className="input-range"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search garments: classic cotton denim, AW25, premium..."
              className="w-full bg-[#0a0e1a]/60 border border-white/8 rounded-2xl pl-14 pr-5 py-4 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/5 transition-all font-medium"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300 text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton />
          ) : results.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.map((product) => (
                  <ProductCard key={product.style_number} product={product} />
                ))}
              </div>

              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
            </div>
          ) : (
            <EmptyState
              title="No products found"
              message="No style items matched your search query or filters. Try adjusting the sidebar criteria."
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Shared product card (used by both pages)
   ============================================================ */
export function ProductCard({ product, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel glow-card rounded-2xl overflow-hidden flex flex-col group ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="relative aspect-square w-full bg-[#0d1424] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.style_name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-stone-700">
            <Compass className="h-8 w-8 animate-pulse text-stone-600" />
          </div>
        )}

        {/* Top-left category chip */}
        <div className="absolute top-3.5 left-3.5">
          <span className="chip-accent backdrop-blur-md bg-[#0a0e1a]/80">
            {product.category}
          </span>
        </div>

        {/* Top-right arrow */}
        {onClick && (
          <div className="absolute top-3.5 right-3.5 h-8 w-8 rounded-full bg-[#0a0e1a]/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-300 group-hover:bg-amber-400 group-hover:text-stone-950 group-hover:border-amber-400 transition-all">
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-eyebrow-muted truncate">
            {product.brand} · {product.style_number}
          </div>
          <h3 className="font-display font-semibold text-base text-stone-100 group-hover:text-amber-300 line-clamp-1 transition-colors tracking-tight">
            {product.style_name}
          </h3>
        </div>

        <div className="inner-panel px-3.5 py-3 text-[12px] text-stone-400 space-y-1 font-medium">
          <div>
            <span className="text-stone-500">Fabric</span>{" "}
            <span className="text-stone-200">{product.fabric}</span>
            <span className="text-stone-600"> · </span>
            <span className="text-amber-400 font-mono text-numeral">{product.gsm} GSM</span>
          </div>
          <div>
            <span className="text-stone-500">Color</span>{" "}
            <span className="text-stone-200">{product.color}</span>
            <span className="text-stone-600"> · </span>
            <span className="text-stone-200">{product.print}</span>
          </div>
          {product.suppliers?.company_name && (
            <div className="truncate">
              <span className="text-stone-500">By</span>{" "}
              <span className="text-stone-300">{product.suppliers.company_name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3.5 border-t border-white/5">
          <span className="text-[10px] font-semibold text-stone-500 tracking-widest uppercase">
            Wholesale
          </span>
          <span className="text-lg font-display font-semibold text-amber-400 text-numeral">
            ${parseFloat(product.selling_price || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Shared filter select
   ============================================================ */
function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-eyebrow-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-base"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          if (typeof opt === "string") {
            return (
              <option key={opt} value={opt}>
                {opt}
              </option>
            );
          }
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

/* ============================================================
   Shared pagination
   ============================================================ */
export function Pagination({ page, totalPages, setPage }) {
  const handlePageChange = (newPage) => {
    setPage(newPage);
    const main = document.querySelector("main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "instant" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        disabled={page <= 1}
        onClick={() => handlePageChange(page - 1)}
        className="btn-ghost"
      >
        Previous
      </button>
      <span className="text-xs text-stone-400 px-3 font-medium font-mono">
        <span className="text-stone-200 font-semibold">{page}</span>
        <span className="text-stone-600 mx-1.5">/</span>
        <span>{totalPages}</span>
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => handlePageChange(page + 1)}
        className="btn-ghost"
      >
        Next
      </button>
    </div>
  );
}

/* ============================================================
   Shared empty state
   ============================================================ */
export function EmptyState({ title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 glass-panel rounded-3xl text-center space-y-4">
      <div className="p-4 rounded-full bg-white/[0.04] border border-white/5">
        <PackageX className="h-7 w-7 text-stone-500" />
      </div>
      <div>
        <h3 className="text-2xl font-display font-semibold text-stone-100 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Skeleton
   ============================================================ */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="glass-panel rounded-2xl overflow-hidden h-[400px] flex flex-col"
        >
          <div className="aspect-square bg-white/[0.04]" />
          <div className="p-5 space-y-3 flex-1">
            <div className="h-3 w-24 bg-white/5 rounded" />
            <div className="h-5 w-40 bg-white/10 rounded" />
            <div className="h-16 bg-white/[0.04] rounded-xl mt-2" />
            <div className="h-5 w-20 bg-white/5 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
