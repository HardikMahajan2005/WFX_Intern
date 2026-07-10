import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import {
  Layers,
  SlidersHorizontal,
  Compass,
  X,
  Star,
  Info,
  Briefcase,
  Sliders,
} from "lucide-react";
import { ProductCard, Pagination, EmptyState } from "./ProductSearch";

export default function FinishedGoods() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFabric, setSelectedFabric] = useState("");
  const [selectedPrint, setSelectedPrint] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  const [gsmMin, setGsmMin] = useState(0);
  const [gsmMax, setGsmMax] = useState(500);
  const [gsmRange, setGsmRange] = useState({ min: 0, max: 500 });

  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [options, setOptions] = useState({
    categories: [],
    fabrics: [],
    colors: [],
    prints: [],
    seasons: [],
    brands: [],
    suppliers: [],
    gsmRange: { min_gsm: 0, max_gsm: 500 },
  });

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(9);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

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
        console.error("Failed to load finished goods options:", err);
      }
    };
    fetchOptions();
  }, []);

  const fetchFinishedGoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/finished-goods", {
        params: {
          category: selectedCategory || undefined,
          fabric: selectedFabric || undefined,
          color: selectedColor || undefined,
          print: selectedPrint || undefined,
          season: selectedSeason || undefined,
          supplier_id: selectedSupplierId || undefined,
          gsm_min: gsmMin !== gsmRange.min ? gsmMin : undefined,
          gsm_max: gsmMax !== gsmRange.max ? gsmMax : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          limit,
        },
      });

      setResults(response.data?.data || []);
      setTotal(response.data?.pagination?.total || 0);
      setTotalPages(response.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error?.message || "Failed to load finished goods.");
    } finally {
      setLoading(false);
    }
  }, [
    selectedCategory, selectedFabric, selectedColor, selectedPrint,
    selectedSeason, selectedSupplierId, gsmMin, gsmMax, gsmRange,
    sortBy, sortOrder, page, limit
  ]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFinishedGoods();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [
    selectedCategory, selectedFabric, selectedColor, selectedPrint,
    selectedSeason, selectedSupplierId, gsmMin, gsmMax, sortBy, sortOrder,
    page, fetchFinishedGoods
  ]);

  const handleOpenModal = async (styleNumber) => {
    setModalLoading(true);
    setModalError(null);
    setSelectedProduct(null);
    try {
      const response = await api.get(`/finished-goods/${styleNumber}`);
      setSelectedProduct(response.data?.data);
    } catch (err) {
      console.error(err);
      setModalError("Failed to load tech pack information for this style.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleFilterChange = (setter, val) => {
    setter(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory("");
    setSelectedFabric("");
    setSelectedPrint("");
    setSelectedColor("");
    setSelectedSeason("");
    setSelectedSupplierId("");
    setGsmMin(gsmRange.min);
    setGsmMax(gsmRange.max);
    setSortBy("created_at");
    setSortOrder("desc");
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="space-y-3">
          <span className="text-eyebrow">Catalog</span>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-stone-100 tracking-tight">
            Finished <span className="italic text-amber-400">goods.</span>
          </h2>
          <p className="text-stone-400 text-sm max-w-md">
            Browse the WFX garment catalog, inspect tech packs, and review vendor parameters.
          </p>
        </div>
        <button onClick={handleResetFilters} className="btn-ghost self-start md:self-auto">
          <Sliders className="h-3.5 w-3.5" />
          Reset
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
              {total} {total === 1 ? "item" : "items"}
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
            label="Print"
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

          <div className="space-y-3 pt-5 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-eyebrow-muted">GSM Weight</span>
              <span className="text-xs font-mono font-semibold text-amber-400 text-numeral">
                {gsmMin}–{gsmMax}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-stone-500 block font-semibold mb-1.5">Min</span>
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
                <span className="text-[10px] text-stone-500 block font-semibold mb-1.5">Max</span>
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
          {/* Sort bar */}
          <div className="glass-panel rounded-2xl px-6 py-4 flex flex-wrap justify-between items-center gap-4">
            <div className="text-xs text-stone-400 font-medium">
              Showing <span className="text-stone-100 font-bold">{results.length}</span>{" "}
              of <span className="font-bold">{total}</span> garments catalogued
            </div>

            <div className="flex items-center gap-3">
              <span className="text-eyebrow-muted">Sort</span>
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                    setPage(1);
                  }}
                  className="select-base pr-9 py-2"
                >
                  <option value="created_at-desc">Latest Added</option>
                  <option value="selling_price-asc">Price: Low → High</option>
                  <option value="selling_price-desc">Price: High → Low</option>
                  <option value="gsm-asc">GSM: Light → Heavy</option>
                  <option value="gsm-desc">GSM: Heavy → Light</option>
                  <option value="style_name-asc">Alphabetical A–Z</option>
                  <option value="style_name-desc">Alphabetical Z–A</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300 text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <GridSkeleton />
          ) : results.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.map((product) => (
                  <ProductCard
                    key={product.style_number}
                    product={product}
                    onClick={() => handleOpenModal(product.style_number)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} setPage={setPage} />
              )}
            </div>
          ) : (
            <EmptyState
              title="No goods catalogued"
              message="No style items matched your filters. Adjust the sidebar criteria to broaden your search."
            />
          )}
        </div>
      </div>

      {/* Spec modal */}
      {(selectedProduct || modalLoading || modalError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel-elev rounded-3xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-up">
            {/* Modal header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-eyebrow">Tech Pack</span>
                {!modalLoading && selectedProduct && (
                  <span className="chip-neutral">
                    {selectedProduct.style_number}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setModalError(null);
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-stone-400 hover:text-stone-100 transition-all border border-white/5"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {modalLoading ? (
                <div className="h-72 flex flex-col items-center justify-center space-y-4">
                  <div className="h-9 w-9 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-stone-500 font-medium">
                    Retrieving tech pack database columns...
                  </span>
                </div>
              ) : modalError ? (
                <div className="h-72 flex flex-col items-center justify-center space-y-3 text-center text-red-300 text-sm">
                  <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
                    <Info className="h-7 w-7 text-red-400" />
                  </div>
                  <span className="font-medium">{modalError}</span>
                </div>
              ) : selectedProduct ? (
                <div className="space-y-8">
                  {/* Hero */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="aspect-[4/5] rounded-2xl bg-[#0d1424] border border-white/5 overflow-hidden shadow-xl">
                      {selectedProduct.image_url ? (
                        <img
                          src={selectedProduct.image_url}
                          alt={selectedProduct.style_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-stone-700">
                          <Compass className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center space-y-6">
                      <div className="space-y-3">
                        <span className="chip-accent">
                          <Layers className="h-3 w-3" />
                          {selectedProduct.category}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-display font-semibold text-stone-100 tracking-tight leading-tight">
                          {selectedProduct.style_name}
                        </h2>
                        <p className="text-sm text-stone-400">
                          Brand ·{" "}
                          <span className="text-stone-200 font-semibold">
                            {selectedProduct.brand || "Unspecified"}
                          </span>
                        </p>
                      </div>

                      {/* Price block */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="inner-panel p-4 space-y-1">
                          <span className="text-eyebrow-muted">Wholesale</span>
                          <div className="text-2xl font-display font-semibold text-amber-400 text-numeral">
                            ${parseFloat(selectedProduct.selling_price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="inner-panel p-4 space-y-1">
                          <span className="text-eyebrow-muted">Cost</span>
                          <div className="text-2xl font-display font-semibold text-stone-200 text-numeral">
                            ${selectedProduct.cost ? parseFloat(selectedProduct.cost).toFixed(2) : "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Spec grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <SpecField label="Fabric" value={selectedProduct.fabric} />
                        <SpecField
                          label="GSM"
                          value={selectedProduct.gsm}
                          mono
                        />
                        <SpecField label="Color" value={selectedProduct.color} />
                        <SpecField label="Print" value={selectedProduct.print} />
                        <SpecField label="Season" value={selectedProduct.season} />
                        <SpecField label="Style #" value={selectedProduct.style_number} mono />
                      </div>
                    </div>
                  </div>

                  {/* Tech pack details */}
                  <div className="gold-rule" />
                  <div className="space-y-5">
                    <h4 className="font-display font-semibold text-stone-100 text-xl tracking-tight flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-amber-400" />
                      Tech Pack Specifications
                    </h4>

                    {selectedProduct.tech_packs && selectedProduct.tech_packs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SpecBlock
                          label="Construction"
                          body={selectedProduct.tech_packs[0].construction}
                        />
                        <SpecBlock
                          label="Fabric Details"
                          body={selectedProduct.tech_packs[0].fabric_details}
                        />
                        <SpecBlock
                          label="Wash & Care"
                          body={selectedProduct.tech_packs[0].wash_instructions}
                          wide
                        />
                      </div>
                    ) : (
                      <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-4 text-sm text-amber-300/90 font-medium">
                        No active tech pack is currently linked to style{" "}
                        {selectedProduct.style_number} in the database.
                      </div>
                    )}
                  </div>

                  {/* Supplier */}
                  {selectedProduct.suppliers && (
                    <>
                      <div className="gold-rule" />
                      <div className="space-y-5">
                        <h4 className="font-display font-semibold text-stone-100 text-xl tracking-tight flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-400" />
                          Supplier
                        </h4>
                        <div className="inner-panel p-6 grid grid-cols-2 md:grid-cols-4 gap-5">
                          <SpecField
                            label="Vendor"
                            value={selectedProduct.suppliers.company_name}
                          />
                          <SpecField
                            label="Lead Time"
                            value={`${selectedProduct.suppliers.lead_time_days} days`}
                          />
                          <SpecField
                            label="Country"
                            value={selectedProduct.suppliers.country || "N/A"}
                          />
                          <SpecField
                            label="Rating"
                            value={
                              <span className="flex items-center gap-1.5 text-amber-400">
                                <Star className="h-3.5 w-3.5 fill-amber-400" />
                                {parseFloat(selectedProduct.suppliers.rating).toFixed(1)}
                              </span>
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <div className="px-8 py-4 border-t border-white/5 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setModalError(null);
                }}
                className="btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Local filter select (re-used)
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

function SpecField({ label, value, mono = false }) {
  return (
    <div className="space-y-1">
      <span className="text-eyebrow-muted block">{label}</span>
      <div
        className={`text-sm text-stone-200 font-semibold ${
          mono ? "font-mono text-amber-400 text-numeral" : ""
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function SpecBlock({ label, body, wide = false }) {
  return (
    <div className={`inner-panel p-5 space-y-2 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-eyebrow-muted block">{label}</span>
      <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap font-medium">
        {body || "Not specified."}
      </p>
    </div>
  );
}

function GridSkeleton() {
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
