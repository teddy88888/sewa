import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetDashboardStats,
  useListBookings,
  useListItems,
  useConfirmBooking,
  useCancelBooking,
  type Booking,
  type Item,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Star,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Plus,
  BookOpen,
  Gift,
  ArrowRight,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function fmtPrice(n: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(n)}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Bayar",
  paid: "Menunggu Konfirmasi",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  paid: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={cn("p-1.5 rounded-lg", accent ?? "bg-muted")}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function BookingRequestCard({ booking }: { booking: Booking }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { mutate: confirm, isPending: confirming } = useConfirmBooking({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/bookings"] });
        qc.invalidateQueries({ queryKey: ["/users/dashboard"] });
        toast({ title: "Pesanan dikonfirmasi!", description: `Pesanan dari ${booking.renterName} disetujui.` });
      },
      onError: () =>
        toast({ title: "Gagal", variant: "destructive" }),
    },
  });

  const { mutate: cancel, isPending: cancelling } = useCancelBooking({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/bookings"] });
        qc.invalidateQueries({ queryKey: ["/users/dashboard"] });
        toast({ title: "Pesanan ditolak.", description: `Pesanan dari ${booking.renterName} dibatalkan.` });
      },
      onError: () =>
        toast({ title: "Gagal", variant: "destructive" }),
    },
  });

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {booking.itemImageUrl ? (
            <img src={booking.itemImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-tight line-clamp-1">
              {booking.itemName}
            </p>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0", STATUS_COLORS[booking.status])}>
              {STATUS_LABELS[booking.status]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dari: <span className="font-medium text-foreground">{booking.renterName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {fmtDate(booking.startDate)} – {fmtDate(booking.endDate)} · {booking.durationDays} hari
          </p>
          <p className="text-sm font-bold text-primary mt-1">{fmtPrice(booking.totalAmount)}</p>
        </div>
      </div>

      {booking.status === "paid" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            disabled={confirming || cancelling}
            onClick={() => confirm({ id: booking.id })}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {confirming ? "Mengkonfirmasi..." : "Konfirmasi"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-destructive hover:text-destructive"
            disabled={confirming || cancelling}
            onClick={() => cancel({ id: booking.id })}
          >
            <XCircle className="h-3.5 w-3.5" />
            {cancelling ? "Menolak..." : "Tolak"}
          </Button>
        </div>
      )}
    </div>
  );
}

function MyItemCard({ item }: { item: Item }) {
  const ITEM_STATUS_COLORS: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700",
    rented: "bg-orange-100 text-orange-700",
    pending: "bg-yellow-100 text-yellow-700",
  };
  const ITEM_STATUS_LABELS: Record<string, string> = {
    available: "Tersedia",
    rented: "Disewa",
    pending: "Menunggu",
  };

  return (
    <Link href={`/items/${item.id}`}>
      <div className="flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
          ) : item.category === "buku" ? (
            <BookOpen className="h-5 w-5 text-muted-foreground/40" />
          ) : (
            <Gift className="h-5 w-5 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", ITEM_STATUS_COLORS[item.status])}>
              {ITEM_STATUS_LABELS[item.status] ?? item.status}
            </span>
            {(item.rating ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {(item.rating ?? 0).toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-primary">{fmtPrice(item.pricePerDay)}</p>
          <p className="text-[10px] text-muted-foreground">/hari</p>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({
  title,
  count,
  href,
  hrefLabel = "Lihat semua",
}: {
  title: string;
  count?: number;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link href={href}>
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
            {hrefLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "listings">("overview");

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { enabled: !!user },
  });

  const { data: allBookings = [], isLoading: bookingsLoading } = useListBookings(undefined, {
    query: { enabled: !!user },
  });

  const { data: itemsData, isLoading: itemsLoading } = useListItems(undefined, {
    query: { enabled: !!user },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold">Masuk untuk melihat dashboard</p>
        <Link href="/login">
          <Button className="mt-4 rounded-full">Masuk</Button>
        </Link>
      </div>
    );
  }

  // Owner bookings = bookings where user is owner
  const ownerBookings = allBookings.filter((b) => b.ownerId === user.id);
  // Paid bookings = waiting for owner confirm
  const pendingConfirm = ownerBookings.filter((b) => b.status === "paid");
  // Active bookings as owner
  const activeOwner = ownerBookings.filter((b) => b.status === "active");
  // My items (owned by this user)
  const myItems = (itemsData?.items ?? []).filter((i) => i.ownerId === user.id);

  // Earnings: sum of completed booking rentalFee as owner
  const totalEarnings = ownerBookings
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + b.rentalFee, 0);

  const isLoading = statsLoading || bookingsLoading || itemsLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Halo, {user.name.split(" ")[0]}!</p>
            </div>
          </div>
          <Link href="/upload">
            <Button className="rounded-full gap-1.5" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Sewakan Item
            </Button>
          </Link>
        </div>

        {/* Attention banner for pending confirms */}
        {pendingConfirm.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-sm font-medium text-blue-800">
                {pendingConfirm.length} permintaan sewa menunggu konfirmasimu
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-100 shrink-0 rounded-full text-xs"
              onClick={() => setActiveTab("requests")}
            >
              Tinjau
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl border bg-muted/40 p-1 gap-1 mb-5">
          {([
            { key: "overview", label: "Ringkasan", icon: <TrendingUp className="h-3.5 w-3.5" /> },
            {
              key: "requests",
              label: "Permintaan",
              icon: <ShoppingBag className="h-3.5 w-3.5" />,
              badge: pendingConfirm.length,
            },
            { key: "listings", label: "Item Saya", icon: <Package className="h-3.5 w-3.5" />, badge: myItems.length },
          ] as const).map(({ key, label, icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-all",
                activeTab === key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {icon}
              {label}
              {badge !== undefined && badge > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 rounded-full",
                  activeTab === key ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Stats grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Total Pendapatan"
                  value={fmtPrice(totalEarnings)}
                  sub="Dari transaksi selesai"
                  icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
                  accent="bg-emerald-50"
                />
                <StatCard
                  label="Item Aktif Disewa"
                  value={String(activeOwner.length)}
                  sub={`${myItems.filter((i) => i.status === "available").length} item tersedia`}
                  icon={<RefreshCw className="h-4 w-4 text-primary" />}
                  accent="bg-primary/10"
                />
                <StatCard
                  label="Total Transaksi"
                  value={String(stats?.totalTransactions ?? 0)}
                  sub="Semua waktu"
                  icon={<Package className="h-4 w-4 text-orange-500" />}
                  accent="bg-orange-50"
                />
                <StatCard
                  label="Rating"
                  value={(stats?.rating ?? 0) > 0 ? (stats!.rating).toFixed(1) : "—"}
                  sub="Rata-rata ulasan"
                  icon={<Star className="h-4 w-4 text-amber-500" />}
                  accent="bg-amber-50"
                />
              </div>
            )}

            {/* Pending confirms preview */}
            {pendingConfirm.length > 0 && (
              <div>
                <SectionHeader
                  title="Perlu Dikonfirmasi"
                  count={pendingConfirm.length}
                  href={undefined}
                  hrefLabel="Lihat semua"
                />
                <div className="space-y-3">
                  {pendingConfirm.slice(0, 2).map((b) => (
                    <BookingRequestCard key={b.id} booking={b} />
                  ))}
                  {pendingConfirm.length > 2 && (
                    <Button
                      variant="outline"
                      className="w-full rounded-full text-sm"
                      onClick={() => setActiveTab("requests")}
                    >
                      Lihat {pendingConfirm.length - 2} permintaan lainnya
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Recent bookings as owner */}
            {ownerBookings.length > 0 && (
              <div>
                <SectionHeader title="Aktivitas Terbaru" href="/bookings" />
                <div className="rounded-xl border bg-card divide-y">
                  {ownerBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {b.itemImageUrl ? (
                          <img src={b.itemImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold line-clamp-1">{b.itemName}</p>
                        <p className="text-[11px] text-muted-foreground">{b.renterName} · {fmtDate(b.startDate)}</p>
                      </div>
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0", STATUS_COLORS[b.status])}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for new owners */}
            {!isLoading && ownerBookings.length === 0 && myItems.length === 0 && (
              <div className="rounded-xl border bg-muted/30 p-8 text-center space-y-3">
                <div className="p-3 rounded-full bg-primary/10 inline-flex mx-auto">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold">Belum ada aktivitas</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Mulai dengan mendaftarkan buku atau mainan yang ingin kamu sewakan.
                </p>
                <Link href="/upload">
                  <Button className="rounded-full mt-1 gap-1.5">
                    <Plus className="h-4 w-4" /> Sewakan Item Pertama
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {/* Needs confirm */}
            {pendingConfirm.length > 0 && (
              <div>
                <SectionHeader title="Menunggu Konfirmasi" count={pendingConfirm.length} />
                <div className="space-y-3">
                  {pendingConfirm.map((b) => (
                    <BookingRequestCard key={b.id} booking={b} />
                  ))}
                </div>
              </div>
            )}

            {/* Active rentals */}
            {activeOwner.length > 0 && (
              <div>
                {pendingConfirm.length > 0 && <Separator className="my-2" />}
                <SectionHeader title="Sedang Disewa" count={activeOwner.length} />
                <div className="space-y-3">
                  {activeOwner.map((b) => (
                    <div key={b.id} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {b.itemImageUrl ? (
                            <img src={b.itemImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-1">{b.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            Disewa oleh: <span className="font-medium text-foreground">{b.renterName}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Kembali: <span className="font-medium text-foreground">{fmtDate(b.endDate)}</span>
                          </p>
                          <p className="text-sm font-bold text-primary mt-1">{fmtPrice(b.totalAmount)}</p>
                        </div>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0", STATUS_COLORS[b.status])}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past owner bookings */}
            {ownerBookings.filter((b) => b.status === "completed" || b.status === "cancelled").length > 0 && (
              <div>
                <Separator className="my-2" />
                <SectionHeader title="Riwayat Pesanan" href="/bookings" />
                <div className="rounded-xl border bg-card divide-y">
                  {ownerBookings
                    .filter((b) => b.status === "completed" || b.status === "cancelled")
                    .slice(0, 5)
                    .map((b) => (
                      <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold line-clamp-1">{b.itemName}</p>
                          <p className="text-xs text-muted-foreground">{b.renterName} · {fmtDate(b.startDate)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{fmtPrice(b.rentalFee)}</p>
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", STATUS_COLORS[b.status])}>
                            {STATUS_LABELS[b.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {!isLoading && ownerBookings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="p-3 rounded-full bg-muted">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-semibold">Belum ada permintaan sewa</p>
                <p className="text-sm text-muted-foreground">Daftarkan item agar orang lain bisa menyewanya.</p>
                <Link href="/upload">
                  <Button className="rounded-full gap-1.5 mt-1">
                    <Plus className="h-4 w-4" /> Sewakan Item
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── LISTINGS TAB ── */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{myItems.length}</span> item terdaftar
                  {myItems.filter((i) => i.status === "available").length > 0 && (
                    <> · <span className="text-emerald-600 font-semibold">{myItems.filter((i) => i.status === "available").length} tersedia</span></>
                  )}
                </p>
              </div>
              <Link href="/upload">
                <Button size="sm" className="rounded-full gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Tambah Item
                </Button>
              </Link>
            </div>

            {itemsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-center py-2">
                    <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="p-3 rounded-full bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-semibold">Belum ada item</p>
                <p className="text-sm text-muted-foreground">Sewakan buku atau mainan anakmu sekarang.</p>
                <Link href="/upload">
                  <Button className="rounded-full gap-1.5 mt-1">
                    <Plus className="h-4 w-4" /> Sewakan Item Pertama
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border bg-card px-4 divide-y">
                {myItems.map((item) => (
                  <MyItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
