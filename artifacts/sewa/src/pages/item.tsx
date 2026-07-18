import { useParams, useLocation, Link } from "wouter";
import {
  useGetItem,
  useListItemReviews,
  useCreateBooking,
  useToggleFavorite,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  MapPin,
  BookOpen,
  Gift,
  Heart,
  Calendar,
  Shield,
  ArrowLeft,
  User,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [1, 3, 7, 14, 30];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function fmtPrice(n: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(n)}`;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [days, setDays] = useState(3);

  const { data: item, isLoading } = useGetItem(Number(id));
  const { data: reviewsData } = useListItemReviews(Number(id));
  const reviews = reviewsData?.reviews ?? [];

  const { mutate: toggleFav } = useToggleFavorite({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["/items"] }) },
  });

  const { mutate: createBooking, isPending: booking } = useCreateBooking({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Pesanan Berhasil!",
          description: "Lanjutkan ke pembayaran di halaman Pesanan Saya.",
        });
        setLocation("/bookings");
      },
      onError: () => {
        toast({
          title: "Gagal",
          description: "Gagal membuat pesanan. Coba lagi.",
          variant: "destructive",
        });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg font-semibold">Item tidak ditemukan</p>
        <Link href="/browse">
          <Button className="mt-4 rounded-full">Telusuri Item Lain</Button>
        </Link>
      </div>
    );
  }

  const startDate = addDays(new Date(), 1);
  const endDate = addDays(startDate, days - 1);
  const rentalFee = item.pricePerDay * days;
  const serviceFee = Math.round(rentalFee * 0.05);
  const totalAmount = rentalFee + item.deposit + serviceFee;
  const isOwner = user?.id === item.ownerId;
  const statusOk = item.status === "available" && !isOwner;

  const handleBook = () => {
    if (!user) {
      toast({ title: "Masuk Dulu", description: "Login untuk menyewa item ini.", variant: "destructive" });
      setLocation("/login");
      return;
    }
    createBooking({
      data: {
        itemId: item.id,
        startDate: fmtDate(startDate),
        endDate: fmtDate(endDate),
      },
    });
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Left: image + reviews */}
          <div className="md:col-span-3 space-y-6">
            {/* Image */}
            <div className="relative rounded-xl overflow-hidden border bg-muted aspect-[4/3]">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {item.category === "buku" ? (
                    <BookOpen className="h-20 w-20 text-muted-foreground/30" />
                  ) : (
                    <Gift className="h-20 w-20 text-muted-foreground/30" />
                  )}
                </div>
              )}

              {/* Fav button */}
              {user && !isOwner && (
                <button
                  onClick={() => toggleFav({ id: item.id })}
                  className={cn(
                    "absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center shadow-md transition-all",
                    item.isFavorited
                      ? "bg-red-500 text-white"
                      : "bg-white/90 text-muted-foreground hover:text-red-500"
                  )}
                >
                  <Heart className={cn("h-5 w-5", item.isFavorited && "fill-current")} />
                </button>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="font-semibold mb-2">Deskripsi</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Owner */}
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pemilik</p>
                <p className="font-semibold text-sm">{item.ownerName ?? "Pengguna"}</p>
              </div>
              {(item.ownerRating ?? 0) > 0 && (
                <div className="ml-auto flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium">{(item.ownerRating ?? 0).toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Ulasan</h3>
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({reviews.length})</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 text-muted-foreground">
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">Belum ada ulasan. Jadilah yang pertama!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {r.reviewerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{r.reviewerName}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "h-3 w-3",
                                  s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(r.createdAt)}</p>
                        {r.comment && (
                          <p className="text-sm mt-1.5 text-muted-foreground">{r.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: booking card (sticky) */}
          <div className="md:col-span-2">
            <div className="sticky top-24">
              <div className="rounded-xl border bg-card shadow-sm p-5 space-y-5">
                {/* Title + category */}
                <div>
                  <div className="flex items-start gap-2 mb-2">
                    <h1 className="text-xl font-bold flex-1">{item.name}</h1>
                    <Badge variant="secondary" className="shrink-0">
                      {item.category === "buku" ? "Buku" : "Mainan"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </span>
                    )}
                    {(item.rating ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {(item.rating ?? 0).toFixed(1)} ({item.reviewCount})
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">{fmtPrice(item.pricePerDay)}</span>
                  <span className="text-muted-foreground">/hari</span>
                </div>

                <Separator />

                {/* Duration picker */}
                <div>
                  <p className="text-sm font-semibold mb-3">Durasi Sewa</p>
                  <div className="flex gap-2 flex-wrap">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                          days === d
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {d} hari
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    {" – "}
                    {endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                <Separator />

                {/* Cost breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Sewa ({days} hari × {fmtPrice(item.pricePerDay)})
                    </span>
                    <span>{fmtPrice(rentalFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit (dikembalikan)</span>
                    <span>{fmtPrice(item.deposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya Layanan (5%)</span>
                    <span>{fmtPrice(serviceFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">{fmtPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  className="w-full rounded-full h-11"
                  disabled={!statusOk || booking}
                  onClick={handleBook}
                >
                  {booking
                    ? "Memproses..."
                    : isOwner
                    ? "Item Milikmu"
                    : item.status === "available"
                    ? "Sewa Sekarang"
                    : "Tidak Tersedia"}
                </Button>

                {/* Trust badges */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                  Deposit dilindungi · Pengembalian dijamin
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
