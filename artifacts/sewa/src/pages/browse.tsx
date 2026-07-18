import { useLocation } from "wouter";
import { useListItems } from "@workspace/api-client-react";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Gift,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function ItemCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="w-full h-44" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const formatK = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}rb` : String(n);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Rp{formatK(value[0])}</span>
        <span>Rp{formatK(value[1])}</span>
      </div>
      <div className="flex gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={value[0]}
          onChange={(e) =>
            onChange([Math.min(Number(e.target.value), value[1] - 1000), value[1]])
          }
          className="w-full accent-primary"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={value[1]}
          onChange={(e) =>
            onChange([value[0], Math.max(Number(e.target.value), value[0] + 1000)])
          }
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [location, setLocation] = useLocation();

  // Parse URL params
  const params = useMemo(() => {
    const url = new URL(window.location.href);
    return {
      search: url.searchParams.get("search") ?? "",
      category: url.searchParams.get("category") ?? "",
    };
  }, [location]);

  const [searchInput, setSearchInput] = useState(params.search);
  const [category, setCategory] = useState<"" | "buku" | "mainan">(
    params.category as "" | "buku" | "mainan"
  );
  const [sort, setSort] = useState<"default" | "price_asc" | "price_desc" | "rating">("default");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Sync URL params → state
  useEffect(() => {
    setSearchInput(params.search);
    setCategory(params.category as "" | "buku" | "mainan");
    setPage(0);
  }, [params.search, params.category]);

  // Fetch all items matching search+category from API
  const { data, isLoading } = useListItems(
    {
      search: searchInput.trim() || undefined,
      category: category || undefined,
      status: onlyAvailable ? "available" : undefined,
      limit: 200,
      offset: 0,
    },
    { query: { keepPreviousData: true } as any }
  );

  // Client-side sort + price filter
  const allItems = data?.items ?? [];

  const filtered = useMemo(() => {
    let items = allItems.filter(
      (i) => i.pricePerDay >= priceRange[0] && i.pricePerDay <= priceRange[1]
    );
    if (sort === "price_asc") items = [...items].sort((a, b) => a.pricePerDay - b.pricePerDay);
    if (sort === "price_desc") items = [...items].sort((a, b) => b.pricePerDay - a.pricePerDay);
    if (sort === "rating") items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return items;
  }, [allItems, priceRange, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Max price across results for slider
  const maxPrice = Math.max(100000, ...allItems.map((i) => i.pricePerDay));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (searchInput.trim()) p.set("search", searchInput.trim());
    if (category) p.set("category", category);
    setLocation(`/browse${p.toString() ? `?${p}` : ""}`);
    setPage(0);
  };

  const handleCategoryChange = (c: "" | "buku" | "mainan") => {
    setCategory(c);
    const p = new URLSearchParams();
    if (searchInput.trim()) p.set("search", searchInput.trim());
    if (c) p.set("category", c);
    setLocation(`/browse${p.toString() ? `?${p}` : ""}`);
    setPage(0);
  };

  const clearFilters = () => {
    setCategory("");
    setSearchInput("");
    setSort("default");
    setPriceRange([0, maxPrice]);
    setOnlyAvailable(false);
    setPage(0);
    setLocation("/browse");
  };

  const hasFilters =
    category !== "" ||
    searchInput.trim() !== "" ||
    sort !== "default" ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    onlyAvailable;

  const handlePageChange = (p: number) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari buku atau mainan..."
                className="pl-9 h-9 rounded-full"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); setLocation("/browse"); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button type="submit" size="sm" className="rounded-full px-4 hidden sm:flex">
              Cari
            </Button>
          </form>

          <Button
            variant="outline"
            size="sm"
            className={cn("gap-1.5 rounded-full", showFilters && "bg-primary text-primary-foreground border-primary")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {hasFilters && (
              <span className="ml-0.5 bg-secondary text-secondary-foreground rounded-full text-[10px] h-4 w-4 flex items-center justify-center font-bold">
                !
              </span>
            )}
          </Button>
        </div>

        {/* Category pills */}
        <div className="container mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {(
            [
              { key: "", label: "Semua" },
              { key: "buku", label: "Buku", icon: <BookOpen className="h-3.5 w-3.5" /> },
              { key: "mainan", label: "Mainan", icon: <Gift className="h-3.5 w-3.5" /> },
            ] as const
          ).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all",
                category === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {icon}
              {label}
            </button>
          ))}

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(0); }}
            className="text-sm border rounded-full px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="default">Relevansi</option>
            <option value="price_asc">Harga: Termurah</option>
            <option value="price_desc">Harga: Termahal</option>
            <option value="rating">Rating Tertinggi</option>
          </select>
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="container mx-auto px-4 pb-4 border-t pt-4">
            <div className="flex flex-wrap items-end gap-6">
              {/* Price range */}
              <div className="min-w-[220px] flex-1 max-w-xs">
                <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  Harga per Hari
                </p>
                <PriceRangeSlider
                  min={0}
                  max={maxPrice}
                  value={priceRange}
                  onChange={(v) => { setPriceRange(v); setPage(0); }}
                />
              </div>

              {/* Availability toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => { setOnlyAvailable(e.target.checked); setPage(0); }}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">Hanya yang tersedia</span>
              </label>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                  Reset filter
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div ref={topRef} className="container mx-auto px-4 py-6">
        {/* Result count */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32 inline-block" />
            ) : (
              <>
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                item ditemukan
                {searchInput && (
                  <>
                    {" "}untuk{" "}
                    <span className="font-semibold text-foreground">
                      "{params.search}"
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">Tidak ada hasil</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Coba ubah kata pencarian atau hapus filter yang aktif.
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="rounded-full">
                Hapus semua filter
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={page === 0}
                  onClick={() => handlePageChange(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const p = totalPages <= 7
                    ? i
                    : page < 4
                    ? i
                    : page > totalPages - 4
                    ? totalPages - 7 + i
                    : page - 3 + i;
                  return (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      className="rounded-full w-9 h-9 text-sm"
                      onClick={() => handlePageChange(p)}
                    >
                      {p + 1}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  disabled={page >= totalPages - 1}
                  onClick={() => handlePageChange(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
