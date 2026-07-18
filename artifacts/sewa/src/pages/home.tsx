import { Link, useLocation } from "wouter";
import { useListItems, useListFeaturedItems, useGetCategoryStats } from "@workspace/api-client-react";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Gift, Search, ArrowRight, Star, Shield, RefreshCw } from "lucide-react";
import { useState } from "react";

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

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [searchInput, setSearchInput] = useState("");

  const { data: featured, isLoading: featuredLoading } = useListFeaturedItems();
  const { data: buku } = useListItems({ category: "buku", limit: 4 });
  const { data: mainan } = useListItems({ category: "mainan", limit: 4 });
  const { data: stats } = useGetCategoryStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      setLocation("/browse");
    }
  };

  const totalItems = stats?.reduce((s, c) => s + c.count, 0) ?? 0;
  const availableItems = stats?.reduce((s, c) => s + (c.availableCount ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
              <Star className="h-3.5 w-3.5 fill-current" />
              Platform sewa peer-to-peer terpercaya
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Sewa Buku & Mainan{" "}
              <span className="text-primary">Berkualitas</span>{" "}
              untuk Anak
            </h1>
            <p className="text-lg text-muted-foreground">
              Hemat pengeluaran keluarga dengan menyewa buku dan mainan pendidikan dari sesama orang tua di sekitarmu.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari buku atau mainan..."
                  className="pl-9 h-11 rounded-full"
                />
              </div>
              <Button type="submit" className="h-11 rounded-full px-6">
                Cari
              </Button>
            </form>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
              <Link href="/browse?category=buku" className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                <BookOpen className="h-4 w-4" />
                Buku
              </Link>
              <span className="text-border">·</span>
              <Link href="/browse?category=mainan" className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                <Gift className="h-4 w-4" />
                Mainan
              </Link>
              {totalItems > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span>{availableItems} item tersedia</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Star className="h-5 w-5 text-amber-500" />,
                title: "Item Terverifikasi",
                desc: "Semua item telah dikurasi dan mendapat ulasan dari komunitas",
              },
              {
                icon: <Shield className="h-5 w-5 text-primary" />,
                title: "Deposit Terlindungi",
                desc: "Deposit otomatis dikembalikan setelah item kembali dalam kondisi baik",
              },
              {
                icon: <RefreshCw className="h-5 w-5 text-secondary" />,
                title: "Hemat & Ramah Lingkungan",
                desc: "Kurangi pengeluaran dan sampah dengan berbagi item bersama",
              },
            ].map((v) => (
              <div key={v.title} className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-lg bg-background border">
                  {v.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{v.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-14">
        {/* Featured */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Rekomendasi</h2>
              <p className="text-sm text-muted-foreground mt-1">Item populer dan berperingkat tinggi</p>
            </div>
            <Link href="/browse">
              <Button variant="ghost" className="gap-1 text-sm">
                Lihat semua <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(featured ?? []).slice(0, 4).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Books */}
        {(buku?.items?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Buku</h2>
                  <p className="text-sm text-muted-foreground">Buku cerita, edukasi & pengetahuan</p>
                </div>
              </div>
              <Link href="/browse?category=buku">
                <Button variant="ghost" className="gap-1 text-sm">
                  Lihat semua <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(buku?.items ?? []).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Toys */}
        {(mainan?.items?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Gift className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Mainan</h2>
                  <p className="text-sm text-muted-foreground">Mainan edukatif & kreatif</p>
                </div>
              </div>
              <Link href="/browse?category=mainan">
                <Button variant="ghost" className="gap-1 text-sm">
                  Lihat semua <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(mainan?.items ?? []).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Punya barang yang tidak terpakai?</h2>
          <p className="mt-2 text-primary-foreground/80 max-w-md mx-auto">
            Daftarkan buku atau mainan anakmu dan mulai mendapat penghasilan tambahan dari menyewakannya.
          </p>
          <Link href="/upload">
            <Button variant="secondary" className="mt-6 rounded-full px-8">
              Mulai Sewakan
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
