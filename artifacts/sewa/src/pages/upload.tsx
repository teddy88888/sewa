import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateItem } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Gift,
  AlertCircle,
  ArrowLeft,
  ImageIcon,
  MapPin,
  Tag,
  Info,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type Category = "buku" | "mainan";

const SUGGESTED_PRICES: Record<Category, { label: string; price: number }[]> = {
  buku: [
    { label: "Buku tipis", price: 5000 },
    { label: "Novel / buku biasa", price: 10000 },
    { label: "Buku tebal / ensiklopedia", price: 15000 },
  ],
  mainan: [
    { label: "Mainan kecil", price: 15000 },
    { label: "Mainan sedang", price: 25000 },
    { label: "Mainan besar / mahal", price: 50000 },
  ],
};

const SUGGESTED_DEPOSITS: Record<Category, { label: string; amount: number }[]> = {
  buku: [
    { label: "Standar", amount: 30000 },
    { label: "Buku mahal", amount: 75000 },
  ],
  mainan: [
    { label: "Standar", amount: 75000 },
    { label: "Mainan mahal", amount: 150000 },
  ],
};

function fmtPrice(n: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(n)}`;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
      <Info className="h-3 w-3 shrink-0 mt-0.5" />
      {children}
    </p>
  );
}

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("buku");
  const [description, setDescription] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [deposit, setDeposit] = useState("");
  const [location, setLocation2] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const { mutate: createItem, isPending } = useCreateItem({
    mutation: {
      onSuccess: (item) => {
        qc.invalidateQueries({ queryKey: ["/items"] });
        setCreatedId(item.id);
        setSubmitted(true);
        toast({
          title: "Item berhasil didaftarkan!",
          description: `${item.name} kini tersedia untuk disewa.`,
        });
      },
      onError: () => {
        toast({
          title: "Gagal mendaftarkan",
          description: "Periksa kembali data dan coba lagi.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(pricePerDay.replace(/\D/g, ""));
    const dep = Number(deposit.replace(/\D/g, ""));
    if (!name.trim()) return;
    if (price <= 0) {
      toast({ title: "Harga tidak valid", description: "Masukkan harga per hari.", variant: "destructive" });
      return;
    }
    if (dep <= 0) {
      toast({ title: "Deposit tidak valid", description: "Masukkan jumlah deposit.", variant: "destructive" });
      return;
    }
    createItem({
      data: {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        pricePerDay: price,
        deposit: dep,
        location: location.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      },
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold">Masuk untuk mendaftarkan item</p>
        <Link href="/login">
          <Button className="mt-4 rounded-full">Masuk</Button>
        </Link>
      </div>
    );
  }

  if (submitted && createdId) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <div className="rounded-2xl border bg-card p-8 space-y-5 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Item Berhasil Didaftarkan!</h2>
            <p className="text-muted-foreground text-sm mt-2">
              <span className="font-semibold text-foreground">{name}</span> kini sudah bisa ditemukan oleh penyewa di SEWA.
            </p>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Link href={`/items/${createdId}`}>
              <Button className="w-full rounded-full">Lihat Halaman Item</Button>
            </Link>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                setSubmitted(false);
                setCreatedId(null);
                setName(""); setDescription(""); setPricePerDay("");
                setDeposit(""); setLocation2(""); setImageUrl("");
              }}
            >
              Daftarkan Item Lain
            </Button>
            <Link href="/browse">
              <Button variant="ghost" className="w-full rounded-full text-muted-foreground">
                Kembali ke Telusuri
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const priceSuggestions = SUGGESTED_PRICES[category];
  const depositSuggestions = SUGGESTED_DEPOSITS[category];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-xl">
        {/* Header */}
        <button
          onClick={() => history.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Sewakan Barang</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftarkan buku atau mainan anakmu dan mulai mendapat penghasilan tambahan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category picker */}
          <div>
            <Label className="mb-2 block">Kategori *</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["buku", "mainan"] as Category[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    category === cat
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat === "buku" ? (
                    <BookOpen className="h-8 w-8" />
                  ) : (
                    <Gift className="h-8 w-8" />
                  )}
                  <span className="font-semibold capitalize">
                    {cat === "buku" ? "Buku" : "Mainan"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Basic info */}
          <div className="space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informasi Item
            </h2>

            <div>
              <Label htmlFor="name">Nama Item *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={category === "buku" ? "Contoh: Harry Potter dan Batu Bertuah" : "Contoh: Lego Duplo Creative Box"}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan kondisi, usia, atau detail lain yang penting untuk penyewa..."
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <FieldHint>Deskripsi yang baik meningkatkan peluang item kamu disewa.</FieldHint>
            </div>

            <div>
              <Label htmlFor="imageUrl" className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                URL Foto Item
              </Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
                type="url"
              />
              {imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border h-36 bg-muted">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
              <FieldHint>Tempel URL foto dari internet. Item dengan foto terjual 3× lebih cepat.</FieldHint>
            </div>

            <div>
              <Label htmlFor="location" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Lokasi
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation2(e.target.value)}
                placeholder="Contoh: Bandung, Jawa Barat"
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Harga & Deposit
            </h2>

            {/* Price per day */}
            <div>
              <Label htmlFor="price" className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Harga Sewa per Hari *
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  Rp
                </span>
                <Input
                  id="price"
                  value={pricePerDay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setPricePerDay(raw ? Number(raw).toLocaleString("id-ID") : "");
                  }}
                  placeholder="0"
                  className="pl-9"
                  required
                />
              </div>
              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {priceSuggestions.map((s) => (
                  <button
                    key={s.price}
                    type="button"
                    onClick={() => setPricePerDay(s.price.toLocaleString("id-ID"))}
                    className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted transition-colors"
                  >
                    {s.label} — {fmtPrice(s.price)}
                  </button>
                ))}
              </div>
              <FieldHint>Harga yang bersaing meningkatkan jumlah penyewa.</FieldHint>
            </div>

            {/* Deposit */}
            <div>
              <Label htmlFor="deposit" className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Deposit *
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  Rp
                </span>
                <Input
                  id="deposit"
                  value={deposit}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setDeposit(raw ? Number(raw).toLocaleString("id-ID") : "");
                  }}
                  placeholder="0"
                  className="pl-9"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {depositSuggestions.map((s) => (
                  <button
                    key={s.amount}
                    type="button"
                    onClick={() => setDeposit(s.amount.toLocaleString("id-ID"))}
                    className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted transition-colors"
                  >
                    {s.label} — {fmtPrice(s.amount)}
                  </button>
                ))}
              </div>
              <FieldHint>
                Deposit ditahan selama masa sewa dan dikembalikan setelah item kembali dalam kondisi baik.
              </FieldHint>
            </div>

            {/* Earnings preview */}
            {pricePerDay && deposit && (
              <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 text-sm space-y-2">
                <p className="font-semibold text-primary">Estimasi Penghasilan</p>
                {[1, 3, 7, 14].map((days) => {
                  const price = Number(pricePerDay.replace(/\D/g, ""));
                  if (!price) return null;
                  return (
                    <div key={days} className="flex justify-between text-muted-foreground">
                      <span>Sewa {days} hari</span>
                      <span className="font-medium text-foreground">
                        {fmtPrice(price * days)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Submit */}
          <div className="pb-4 space-y-3">
            <Button
              type="submit"
              className="w-full h-12 rounded-full text-base"
              disabled={isPending || !name.trim() || !pricePerDay || !deposit}
            >
              {isPending ? "Mendaftarkan..." : "Daftarkan Item Sekarang"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Dengan mendaftarkan item, kamu menyetujui kebijakan penyewaan SEWA.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
