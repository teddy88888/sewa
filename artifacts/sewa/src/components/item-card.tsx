import { Link } from "wouter";
import { Star, MapPin, BookOpen, Gift, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Item } from "@workspace/api-client-react";
import { useToggleFavorite } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: Item;
  className?: string;
}

export function ItemCard({ item, className }: ItemCardProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { mutate: toggleFav, isPending } = useToggleFavorite({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/items"] }),
    },
  });

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "decimal" }).format(n);

  const statusColors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rented: "bg-orange-100 text-orange-700 border-orange-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  const statusLabels: Record<string, string> = {
    available: "Tersedia",
    rented: "Disewa",
    pending: "Menunggu",
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden",
        className
      )}
    >
      {/* Image */}
      <Link href={`/items/${item.id}`} className="block">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-44 bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
            {item.category === "buku" ? (
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            ) : (
              <Gift className="h-12 w-12 text-muted-foreground/40" />
            )}
          </div>
        )}
      </Link>

      {/* Favorite button */}
      {user && (
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFav({ id: item.id });
          }}
          disabled={isPending}
          className={cn(
            "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-sm transition-all",
            item.isFavorited
              ? "bg-red-500 text-white"
              : "bg-white/90 text-muted-foreground hover:text-red-500"
          )}
        >
          <Heart className={cn("h-4 w-4", item.isFavorited && "fill-current")} />
        </button>
      )}

      {/* Status badge */}
      <div className="absolute top-2 left-2">
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full border",
            statusColors[item.status] ?? "bg-gray-100 text-gray-600"
          )}
        >
          {statusLabels[item.status] ?? item.status}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/items/${item.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
              {item.name}
            </h3>
          </Link>
          <Badge
            variant="secondary"
            className="shrink-0 text-[10px] px-1.5 py-0"
          >
            {item.category === "buku" ? "Buku" : "Mainan"}
          </Badge>
        </div>

        {item.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <span className="text-base font-bold text-primary">
              Rp{formatPrice(item.pricePerDay)}
            </span>
            <span className="text-xs text-muted-foreground">/hari</span>
          </div>
          {(item.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">
                {(item.rating ?? 0).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({item.reviewCount})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
