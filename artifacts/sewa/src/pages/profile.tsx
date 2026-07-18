import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useUpdateProfile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Phone,
  MapPin,
  Star,
  Package,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function fmtPrice(n: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(n)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border bg-card text-center flex-1">
      <div className="text-primary">{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setLocation("");
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  const { mutate: updateProfile, isPending } = useUpdateProfile({
    mutation: {
      onSuccess: (updated) => {
        qc.invalidateQueries({ queryKey: ["/users/me"] });
        setEditing(false);
        toast({
          title: "Profil diperbarui!",
          description: "Perubahan berhasil disimpan.",
        });
      },
      onError: () => {
        toast({
          title: "Gagal menyimpan",
          description: "Coba lagi.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSave = () => {
    updateProfile({
      data: {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      },
    });
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }
    setEditing(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold">Masuk untuk melihat profil</p>
        <Link href="/login">
          <Button className="mt-4 rounded-full">Masuk</Button>
        </Link>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel: Record<string, string> = {
    penyewa: "Penyewa",
    pemilik: "Pemilik",
    admin: "Admin",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profil Saya</h1>
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Profil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 rounded-full text-muted-foreground"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="h-3.5 w-3.5" />
                Batal
              </Button>
              <Button
                size="sm"
                className="gap-1.5 rounded-full"
                onClick={handleSave}
                disabled={isPending}
              >
                <Save className="h-3.5 w-3.5" />
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          )}
        </div>

        {/* Avatar + name */}
        <div className="rounded-xl border bg-card p-5 mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || user.avatarUrl || ""} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Nama</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">URL Avatar</Label>
                    <Input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold truncate">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {roleLabel[user.role] ?? user.role}
                    </span>
                    {(user.rating ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {(user.rating ?? 0).toFixed(1)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {!editing && (
          <div className="flex gap-3 mb-4">
            <StatBadge
              icon={<Package className="h-4 w-4" />}
              label="Total Transaksi"
              value={String(user.totalTransactions ?? 0)}
            />
            <StatBadge
              icon={<CreditCard className="h-4 w-4" />}
              label="Saldo Deposit"
              value={fmtPrice(user.depositBalance ?? 0)}
            />
            {(user.rating ?? 0) > 0 && (
              <StatBadge
                icon={<Star className="h-4 w-4" />}
                label="Rating"
                value={(user.rating ?? 0).toFixed(1)}
              />
            )}
          </div>
        )}

        {/* Contact & details */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Informasi Kontak
          </h3>

          <div className="space-y-4">
            {/* Email (read-only) */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            </div>

            <Separator />

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Nomor Telepon</p>
                {editing ? (
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 xxx xxxx xxxx"
                    className="h-8 text-sm mt-0.5"
                  />
                ) : (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      !user.phone && "text-muted-foreground italic"
                    )}
                  >
                    {user.phone || "Belum diisi"}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Lokasi</p>
                {editing ? (
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Kota, Provinsi"
                    className="h-8 text-sm mt-0.5"
                  />
                ) : (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      !location && "text-muted-foreground italic"
                    )}
                  >
                    {location || "Belum diisi"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Member since */}
        {user.createdAt && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Bergabung sejak {fmtDate(user.createdAt)}
          </p>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link href="/bookings">
            <div className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <Package className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold">Pesanan Saya</p>
              <p className="text-xs text-muted-foreground">Lihat riwayat sewa</p>
            </div>
          </Link>
          <Link href="/wallet">
            <div className="rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <CreditCard className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold">Dompet Deposit</p>
              <p className="text-xs text-muted-foreground">Kelola saldo deposit</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
