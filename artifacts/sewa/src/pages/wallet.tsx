import { Link } from "wouter";
import { useGetWallet } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Gift,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

function fmtPrice(n: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(n)}`;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TX_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; sign: string }
> = {
  deposit: {
    label: "Deposit Masuk",
    icon: <ArrowDownCircle className="h-4 w-4" />,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    sign: "+",
  },
  refund: {
    label: "Pengembalian Deposit",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    sign: "+",
  },
  deduction: {
    label: "Potongan",
    icon: <ArrowUpCircle className="h-4 w-4" />,
    color: "text-red-600 bg-red-50 border-red-200",
    sign: "-",
  },
  credit: {
    label: "Kredit",
    icon: <Gift className="h-4 w-4" />,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    sign: "+",
  },
};

function TransactionRow({
  tx,
}: {
  tx: {
    id: number;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  };
}) {
  const meta = TX_META[tx.type] ?? {
    label: tx.type,
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    sign: "",
  };

  const isPositive = meta.sign === "+";

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "h-9 w-9 rounded-full border flex items-center justify-center shrink-0",
          meta.color
        )}
      >
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{meta.label}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {tx.description}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {fmtDateTime(tx.createdAt)}
        </p>
      </div>

      <span
        className={cn(
          "text-sm font-bold shrink-0",
          isPositive ? "text-emerald-600" : "text-red-600"
        )}
      >
        {meta.sign}
        {fmtPrice(tx.amount)}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-2",
        highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card"
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn("text-xs font-medium", highlight ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {label}
        </p>
        <div className={cn("p-1.5 rounded-lg", highlight ? "bg-primary-foreground/10" : "bg-muted")}>
          {icon}
        </div>
      </div>
      <p className={cn("text-2xl font-bold", highlight ? "text-primary-foreground" : "text-foreground")}>
        {value}
      </p>
      {sub && (
        <p className={cn("text-xs", highlight ? "text-primary-foreground/60" : "text-muted-foreground")}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function WalletPage() {
  const { user } = useAuth();

  const { data: wallet, isLoading } = useGetWallet({
    query: { enabled: !!user },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold">Masuk untuk melihat dompet</p>
        <Link href="/login">
          <Button className="mt-4 rounded-full">Masuk</Button>
        </Link>
      </div>
    );
  }

  const transactions = wallet?.transactions ?? [];

  // Simple stats from transaction history
  const totalIn = transactions
    .filter((t) => TX_META[t.type]?.sign === "+")
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions
    .filter((t) => TX_META[t.type]?.sign === "-")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dompet Deposit</h1>
            <p className="text-sm text-muted-foreground">Kelola saldo deposit kamu</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Saldo Tersedia"
                value={fmtPrice(wallet?.availableBalance ?? 0)}
                sub="Dapat digunakan"
                icon={<CreditCard className="h-4 w-4 text-primary-foreground" />}
                highlight
              />
              <StatCard
                label="Saldo Ditahan"
                value={fmtPrice(wallet?.heldAmount ?? 0)}
                sub="Untuk deposit aktif"
                icon={<Lock className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            {/* Total balance */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Saldo</p>
                  <p className="text-3xl font-bold mt-1">{fmtPrice(wallet?.balance ?? 0)}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1 text-xs text-emerald-600 justify-end">
                    <TrendingDown className="h-3 w-3" />
                    <span>+{fmtPrice(totalIn)} masuk</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-red-500 justify-end">
                    <TrendingUp className="h-3 w-3" />
                    <span>-{fmtPrice(totalOut)} keluar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
              <p className="font-semibold">Cara Kerja Deposit</p>
              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p>Saat menyewa, deposit ditahan sebagai jaminan keamanan item.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p>Setelah item dikembalikan dalam kondisi baik, deposit dikembalikan otomatis.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p>Jika ada kerusakan, deposit mungkin dipotong sesuai kebijakan.</p>
                </div>
              </div>
            </div>

            {/* Transaction history */}
            <div className="rounded-xl border bg-card">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h2 className="font-semibold">Riwayat Transaksi</h2>
                <span className="text-xs text-muted-foreground">
                  {transactions.length} transaksi
                </span>
              </div>
              <Separator />

              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                  <div className="p-3 rounded-full bg-muted">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Belum ada transaksi</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Transaksi deposit akan muncul di sini.
                    </p>
                  </div>
                  <Link href="/browse">
                    <Button variant="outline" className="rounded-full mt-1">
                      Mulai Sewa
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="px-4 divide-y">
                  {transactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
