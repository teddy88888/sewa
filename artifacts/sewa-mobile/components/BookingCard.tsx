import { Feather } from "@expo/vector-icons";
import type { Booking } from "@workspace/api-client-react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgSuffix: string }
> = {
  pending: { label: "Menunggu Pembayaran", color: "#f59e0b", bgSuffix: "20" },
  paid: { label: "Dibayar", color: "#3b82f6", bgSuffix: "20" },
  active: { label: "Aktif", color: "#22c55e", bgSuffix: "20" },
  completed: { label: "Selesai", color: "#6b7280", bgSuffix: "20" },
  cancelled: { label: "Dibatalkan", color: "#ef4444", bgSuffix: "20" },
};

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const colors = useColors();
  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG["pending"];

  const formatPrice = (price: number) =>
    `Rp${price.toLocaleString("id-ID")}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        {booking.itemImageUrl ? (
          <Image
            source={{ uri: booking.itemImageUrl }}
            style={[
              styles.image,
              { borderRadius: colors.radius / 2 },
            ]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius / 2,
              },
            ]}
          >
            <Feather name="package" size={22} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.headerContent}>
          <Text
            style={[styles.itemName, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {booking.itemName ?? "Item"}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusCfg.color + statusCfg.bgSuffix },
            ]}
          >
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={12} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
          </Text>
          {booking.durationDays ? (
            <Text style={[styles.durationBadge, { color: colors.primary, backgroundColor: colors.accent }]}>
              {booking.durationDays} hari
            </Text>
          ) : null}
        </View>
        <View style={styles.amountRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
            Total
          </Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatPrice(booking.totalAmount)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  image: {
    width: 56,
    height: 56,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  divider: {
    height: 1,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  durationBadge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
});
