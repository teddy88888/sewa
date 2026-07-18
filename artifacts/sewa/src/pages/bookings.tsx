import { useState } from "react";
import { Link } from "wouter";
import {
  useListBookings,
  useCancelBooking,
  useCreatePayment,
  useReturnBooking,
  type Booking,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Gift,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  ArrowRight,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Bayar",
  paid: "Dikonfirmasi",
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

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  paid: <CheckCircle className="h-3.5 w-3.5" />,
  active: <RefreshCw className="h-3.5 w-3.5" />,
  completed: <CheckCircle className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
};

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Transfer Bank", icon: "🏦" },
  { value: "gopay", label: "GoPay", icon: "💚" },
  { value: "ovo", label: "OVO", icon: "💜" },
  { value: "dana", label: "DANA", icon: "💙" },
] as const;

const RETURN_CONDITIONS = [
  { value: "good", label: "Kondisi Baik", desc: "Item kembali dalam kondisi sempurna", color: "border-emerald-400 text-emerald-700" },
  { value: "damaged", label: "Ada Kerusakan", desc: "Item mengalami kerusakan minor/major", color: "border-orange-400 text-orange-700" },
  { value: "lost", label: "Hilang", desc: "Item tidak dapat dikembalikan", color: "border-red-400 text-red-700" },
] as const;

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

function BookingCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

function PaymentModal({
  booking,
  open,
  onClose,
}: {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<"bank_transfer" | "gopay" | "ovo" | "dana">("gopay");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { mutate: pay, isPending } = useCreatePayment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/bookings"] });
        onClose();
        toast({
          title: "Pembayaran Berhasil!",
          description: `Pesanan #${booking.id} sudah dikonfirmasi.`,
        });
      },
      onError: () => {
        toast({ title: "Pembayaran Gagal", description: "Coba lagi.", variant: "destructive" });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Booking summary */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <p className="font-semibold">{booking.itemName}</p>
            <p className="text-muted-foreground">
              {fmtDate(booking.startDate)} – {fmtDate(booking.endDate)} · {booking.durationDays} hari
            </p>
            <p className="text-base font-bold text-primary">{fmtPrice(booking.totalAmount)}</p>
          </div>

          {/* Method picker */}
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium",
                  method === m.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            onClick={() => pay({ data: { bookingId: booking.id, method } })}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Memproses..." : `Bayar ${fmtPrice(booking.totalAmount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReturnModal({
  booking,
  open,
  onClose,
}: {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}) {
  const [condition, setCondition] = useState<"good" | "damaged" | "lost">("good");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { mutate: returnItem, isPending } = useReturnBooking({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/bookings"] });
        onClose();
        toast({
          title: "Pengembalian Dicatat!",
          description: condition === "good" ? "Deposit akan segera dikembalikan." : "Tim kami akan meninjau kondisi item.",
        });
      },
      onError: () => {
        toast({ title: "Gagal", description: "Coba lagi.", variant: "destructive" });
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pengembalian</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Pilih kondisi <span className="font-semibold text-foreground">{booking.itemName}</span> saat dikembalikan:
          </p>

          <div className="space-y-2">
            {RETURN_CONDITIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCondition(c.value)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left",
                  condition === c.value ? `border-2 ${c.color} bg-opacity-5` : "border-border hover:border-primary/40"
                )}
              >
                <div className={cn(
                  "mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                  condition === c.value ? "border-primary" : "border-muted-foreground/30"
                )}>
                  {condition === c.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan kondisi item..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            onClick={() => returnItem({ id: booking.id, data: { condition, notes: notes || undefined } })}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Memproses..." : "Konfirmasi Pengembalian"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingCard({ booking, viewAs }: { booking: Booking; viewAs: "renter" | "owner" }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [payModal, setPayModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);

  const { mutate: cancel, isPending: cancelling } = useCancelBooking({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/bookings"] });
        toast({ title: "Pesanan Dibatalkan", description: `Pesanan #${booking.id} telah dibatalkan.` });
      },
      onError: () => {
        toast({ title: "Gagal", description: "Tidak dapat membatalkan pesanan.", variant: "destructive" });
      },
    },
  });

  const isRenter = user?.id === booking.renterId;

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex gap-3">
            {/* Item image */}
            <Link href={`/items/${booking.itemId}`} className="shrink-0">
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {booking.itemImageUrl ? (
                  <img src={booking.itemImageUrl} alt={booking.itemName ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link href={`/items/${booking.itemId}`}>
                  <h3 className="font-semibold text-sm leading-tight hover:text-primary transition-colors line-clamp-1">
                    {booking.itemName ?? "Item"}
                  </h3>
                </Link>
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0",
                    STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-600"
                  )}
                >
                  {STATUS_ICONS[booking.status]}
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {fmtDate(booking.startDate)} – {fmtDate(booking.endDate)}
                </div>
                <p>{booking.durationDays} hari · {viewAs === "owner" ? `Penyewa: ${booking.renterName}` : `Pemilik: ${booking.ownerName}`}</p>
              </div>

              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="font-bold text-primary">{fmtPrice(booking.totalAmount)}</span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
            </div>
          </div>

          {/* Cost breakdown (collapsible via details) */}
          <details className="mt-3">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
              Lihat rincian biaya
            </summary>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sewa {booking.durationDays} hari</span>
                <span>{fmtPrice(booking.rentalFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit</span>
                <span>{fmtPrice(booking.depositAmount)}</span>
              </div>
              {(booking.serviceFee ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya layanan</span>
                  <span>{fmtPrice(booking.serviceFee ?? 0)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">{fmtPrice(booking.totalAmount)}</span>
              </div>
              {booking.depositStatus && (
                <p className="text-muted-foreground pt-0.5">
                  Status deposit:{" "}
                  <span className={cn(
                    "font-medium",
                    booking.depositStatus === "refunded" ? "text-emerald-600" : ""
                  )}>
                    {booking.depositStatus === "held" ? "Ditahan" :
                     booking.depositStatus === "refunded" ? "Dikembalikan" : "Dipotong"}
                  </span>
                </p>
              )}
            </div>
          </details>
        </div>

        {/* Action buttons */}
        {(booking.status === "pending" || booking.status === "paid" || booking.status === "active") && (
          <div className="px-4 pb-4 flex gap-2 flex-wrap">
            {/* Renter: Pay for pending bookings */}
            {isRenter && booking.status === "pending" && (
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => setPayModal(true)}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Bayar Sekarang
              </Button>
            )}

            {/* Renter: Return for active bookings */}
            {isRenter && booking.status === "active" && (
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 gap-1.5"
                onClick={() => setReturnModal(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Kembalikan Item
              </Button>
            )}

            {/* Cancel for pending/paid (either party) */}
            {(booking.status === "pending" || booking.status === "paid") && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive"
                disabled={cancelling}
                onClick={() => cancel({ id: booking.id })}
              >
                <XCircle className="h-3.5 w-3.5" />
                {cancelling ? "Membatalkan..." : "Batalkan"}
              </Button>
            )}
          </div>
        )}
      </div>

      {payModal && (
        <PaymentModal booking={booking} open={payModal} onClose={() => setPayModal(false)} />
      )}
      {returnModal && (
        <ReturnModal booking={booking} open={returnModal} onClose={() => setReturnModal(false)} />
      )}
    </>
  );
}

const STATUS_TABS = [
  { key: "", label: "Semua" },
  { key: "pending", label: "Menunggu Bayar" },
  { key: "paid", label: "Dikonfirmasi" },
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
] as const;

export default function BookingsPage() {
  const { user } = useAuth();
  const [viewAs, setViewAs] = useState<"renter" | "owner">("renter");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: bookings = [], isLoading } = useListBookings(undefined, {
    query: { enabled: !!user },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold">Masuk untuk melihat pesanan</p>
        <Link href="/login">
          <Button className="mt-4 rounded-full">Masuk</Button>
        </Link>
      </div>
    );
  }

  // Separate as renter vs owner
  const renterBookings = bookings.filter((b) => b.renterId === user.id);
  const ownerBookings = bookings.filter((b) => b.ownerId === user.id);
  const activeList = viewAs === "renter" ? renterBookings : ownerBookings;

  const filtered = statusFilter
    ? activeList.filter((b) => b.status === statusFilter)
    : activeList;

  const pendingCount = renterBookings.filter((b) => b.status === "pending").length;
  const activeCount = renterBookings.filter((b) => b.status === "active").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pesanan Saya</h1>
          {(pendingCount > 0 || activeCount > 0) && (
            <div className="flex gap-3 mt-2">
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  {pendingCount} menunggu pembayaran
                </div>
              )}
              {activeCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                  <RefreshCw className="h-3.5 w-3.5" />
                  {activeCount} sedang aktif
                </div>
              )}
            </div>
          )}
        </div>

        {/* View toggle: penyewa vs pemilik */}
        <div className="flex rounded-xl border bg-muted/40 p-1 gap-1 mb-4">
          {(["renter", "owner"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setViewAs(v); setStatusFilter(""); }}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-lg transition-all",
                viewAs === v
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "renter" ? (
                <span className="flex items-center justify-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Sebagai Penyewa
                  {renterBookings.length > 0 && (
                    <span className="bg-primary/10 text-primary text-[10px] rounded-full px-1.5 font-bold">
                      {renterBookings.length}
                    </span>
                  )}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Gift className="h-3.5 w-3.5" />
                  Sebagai Pemilik
                  {ownerBookings.length > 0 && (
                    <span className="bg-primary/10 text-primary text-[10px] rounded-full px-1.5 font-bold">
                      {ownerBookings.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {STATUS_TABS.map(({ key, label }) => {
            const count = key ? activeList.filter((b) => b.status === key).length : activeList.length;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                  statusFilter === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {label}
                {count > 0 && (
                  <span className={cn(
                    "ml-1.5 text-[10px] rounded-full px-1",
                    statusFilter === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <BookingCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">Belum ada pesanan</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {viewAs === "renter"
                  ? "Mulai sewa buku atau mainan favoritmu."
                  : "Belum ada yang menyewa itemmu."}
              </p>
            </div>
            {viewAs === "renter" && (
              <Link href="/browse">
                <Button className="rounded-full gap-1.5">
                  Telusuri Item <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <BookingCard key={booking.id} booking={booking} viewAs={viewAs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
