import { Feather } from "@expo/vector-icons";
import {
  useCancelBooking,
  useConfirmBooking,
  useListBookings,
  useListMyItems,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  paid: "Dibayar",
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatal",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  active: "#1a9b87",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  available: "Tersedia",
  rented: "Disewa",
  pending: "Menunggu",
};

const ITEM_STATUS_COLOR: Record<string, string> = {
  available: "#1a9b87",
  rented: "#f56c20",
  pending: "#f59e0b",
};

function formatPrice(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const topPadding = Platform.OS === "web" ? 20 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    data: ownerBookings = [],
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useListBookings({ role: "owner" }, { query: { enabled: !!user } });

  const {
    data: myItems = [],
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = useListMyItems({ query: { enabled: !!user } });

  const { mutate: confirmBooking, isPending: confirming } = useConfirmBooking({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        qc.invalidateQueries({ queryKey: ["/bookings"] });
        refetchBookings();
      },
    },
  });

  const { mutate: cancelBooking, isPending: cancelling } = useCancelBooking({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        qc.invalidateQueries({ queryKey: ["/bookings"] });
        refetchBookings();
      },
    },
  });

  const handleConfirm = (id: number, itemName: string | null) => {
    Alert.alert(
      "Konfirmasi Pesanan",
      `Setujui pesanan untuk "${itemName ?? "item ini"}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Setujui",
          onPress: () => confirmBooking({ id }),
        },
      ]
    );
  };

  const handleDecline = (id: number, itemName: string | null) => {
    Alert.alert(
      "Tolak Pesanan",
      `Tolak pesanan untuk "${itemName ?? "item ini"}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Tolak",
          style: "destructive",
          onPress: () => cancelBooking({ id }),
        },
      ]
    );
  };

  const pendingBookings = ownerBookings.filter((b) => b.status === "pending");
  const activeBookings = ownerBookings.filter((b) => b.status === "active");
  const completedBookings = ownerBookings.filter((b) => b.status === "completed");

  const totalEarnings = completedBookings.reduce(
    (sum, b) => sum + (b.rentalFee ?? 0),
    0
  );
  const activeCount = activeBookings.length;

  const avgRating =
    myItems.length > 0
      ? myItems.reduce((s, i) => s + (i.rating ?? 0), 0) / myItems.filter((i) => (i.rating ?? 0) > 0).length || 0
      : 0;

  const isLoading = bookingsLoading || itemsLoading;

  const onRefresh = async () => {
    await Promise.all([refetchBookings(), refetchItems()]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Dashboard Pemilik
        </Text>
        <Pressable
          onPress={() => router.push("/daftar-item")}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPadding + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" },
              ]}
            >
              <Feather name="trending-up" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {formatPrice(totalEarnings)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Total Pendapatan
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: "#f56c2018", borderColor: "#f56c2040" },
              ]}
            >
              <Feather name="package" size={18} color="#f56c20" />
              <Text style={[styles.statValue, { color: "#f56c20" }]}>
                {activeCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Aktif Disewa
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: "#f59e0b18", borderColor: "#f59e0b40" },
              ]}
            >
              <Feather name="star" size={18} color="#f59e0b" />
              <Text style={[styles.statValue, { color: "#f59e0b" }]}>
                {avgRating > 0 ? avgRating.toFixed(1) : "—"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Rating Rata-rata
              </Text>
            </View>
          </View>

          {/* Second stats row */}
          <View style={styles.statsRowSmall}>
            <View
              style={[
                styles.statCardSmall,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValueSmall, { color: colors.foreground }]}>
                {myItems.length}
              </Text>
              <Text style={[styles.statLabelSmall, { color: colors.mutedForeground }]}>
                Total Listing
              </Text>
            </View>
            <View
              style={[
                styles.statCardSmall,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValueSmall, { color: colors.foreground }]}>
                {completedBookings.length}
              </Text>
              <Text style={[styles.statLabelSmall, { color: colors.mutedForeground }]}>
                Pesanan Selesai
              </Text>
            </View>
            <View
              style={[
                styles.statCardSmall,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValueSmall, { color: colors.foreground }]}>
                {pendingBookings.length}
              </Text>
              <Text style={[styles.statLabelSmall, { color: colors.mutedForeground }]}>
                Menunggu Konfirmasi
              </Text>
            </View>
          </View>

          {/* Pending Bookings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Pesanan Masuk
              </Text>
              {pendingBookings.length > 0 && (
                <View
                  style={[styles.badge, { backgroundColor: "#f59e0b" }]}
                >
                  <Text style={styles.badgeText}>{pendingBookings.length}</Text>
                </View>
              )}
            </View>

            {pendingBookings.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.muted, borderRadius: colors.radius / 2 },
                ]}
              >
                <Feather name="inbox" size={22} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Tidak ada pesanan yang perlu dikonfirmasi
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {pendingBookings.map((booking) => (
                  <View
                    key={booking.id}
                    style={[
                      styles.bookingCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <View style={styles.bookingTop}>
                      <View style={styles.bookingInfo}>
                        <Text
                          style={[styles.bookingItemName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {booking.itemName ?? "—"}
                        </Text>
                        <Text
                          style={[styles.bookingRenter, { color: colors.mutedForeground }]}
                        >
                          Penyewa: {booking.renterName ?? "—"}
                        </Text>
                        <Text
                          style={[styles.bookingDates, { color: colors.mutedForeground }]}
                        >
                          {formatDate(booking.startDate)} — {formatDate(booking.endDate)} ({booking.durationDays}h)
                        </Text>
                      </View>
                      <View style={styles.bookingRight}>
                        <Text style={[styles.bookingAmount, { color: colors.primary }]}>
                          {formatPrice(booking.rentalFee)}
                        </Text>
                        <Text style={[styles.bookingAmountLabel, { color: colors.mutedForeground }]}>
                          sewa
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bookingActions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.declineBtn,
                          {
                            borderColor: "#ef4444",
                            borderRadius: colors.radius / 2,
                            opacity: pressed || confirming || cancelling ? 0.6 : 1,
                          },
                        ]}
                        onPress={() => handleDecline(booking.id, booking.itemName ?? null)}
                        disabled={confirming || cancelling}
                      >
                        <Text style={[styles.declineBtnText, { color: "#ef4444" }]}>
                          Tolak
                        </Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.confirmBtn,
                          {
                            backgroundColor: colors.primary,
                            borderRadius: colors.radius / 2,
                            opacity: pressed || confirming || cancelling ? 0.6 : 1,
                          },
                        ]}
                        onPress={() => handleConfirm(booking.id, booking.itemName ?? null)}
                        disabled={confirming || cancelling}
                      >
                        {confirming ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.confirmBtnText}>Setujui</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Active rentals */}
          {activeBookings.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Sedang Aktif Disewa
              </Text>
              <View style={styles.cardList}>
                {activeBookings.map((booking) => (
                  <View
                    key={booking.id}
                    style={[
                      styles.activeCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.primary + "60",
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <View style={styles.activeCardRow}>
                      <View
                        style={[
                          styles.activeDot,
                          { backgroundColor: "#1a9b87" },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.bookingItemName, { color: colors.foreground }]}>
                          {booking.itemName ?? "—"}
                        </Text>
                        <Text style={[styles.bookingRenter, { color: colors.mutedForeground }]}>
                          Penyewa: {booking.renterName ?? "—"} · Kembali {formatDate(booking.endDate)}
                        </Text>
                      </View>
                      <Text style={[styles.bookingAmount, { color: colors.primary }]}>
                        {formatPrice(booking.rentalFee)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* My Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Item Saya
              </Text>
              <Pressable
                onPress={() => router.push("/daftar-item")}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  + Tambah
                </Text>
              </Pressable>
            </View>

            {myItems.length === 0 ? (
              <Pressable
                onPress={() => router.push("/daftar-item")}
                style={({ pressed }) => [
                  styles.emptyCard,
                  {
                    backgroundColor: colors.muted,
                    borderRadius: colors.radius / 2,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="plus-circle" size={22} color={colors.primary} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Belum ada item listing. Daftarkan item pertamamu!
                </Text>
              </Pressable>
            ) : (
              <View style={styles.cardList}>
                {myItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/item/${item.id}` as any)}
                    style={({ pressed }) => [
                      styles.itemCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: colors.radius,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={styles.itemCardRow}>
                      <View
                        style={[
                          styles.itemIcon,
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Feather
                          name={item.category === "buku" ? "book" : "gift"}
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text
                          style={[styles.itemName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View style={styles.itemMeta}>
                          <Text style={[styles.itemPrice, { color: colors.primary }]}>
                            {formatPrice(item.pricePerDay)}/hari
                          </Text>
                          {(item.rating ?? 0) > 0 && (
                            <View style={styles.itemRating}>
                              <Feather name="star" size={11} color="#f59e0b" />
                              <Text style={[styles.itemRatingText, { color: colors.mutedForeground }]}>
                                {(item.rating ?? 0).toFixed(1)} ({item.reviewCount})
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: (ITEM_STATUS_COLOR[item.status] ?? "#6b7280") + "20",
                            borderRadius: 6,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: ITEM_STATUS_COLOR[item.status] ?? "#6b7280" },
                          ]}
                        >
                          {ITEM_STATUS_LABEL[item.status] ?? item.status}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Completed history (collapsed) */}
          {completedBookings.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Riwayat Selesai
              </Text>
              <View
                style={[
                  styles.historyCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                {completedBookings.slice(0, 5).map((booking, idx) => (
                  <View key={booking.id}>
                    <View style={styles.historyRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.historyItemName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {booking.itemName ?? "—"}
                        </Text>
                        <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                          {booking.renterName ?? "—"} · {formatDate(booking.startDate)}
                        </Text>
                      </View>
                      <Text style={[styles.historyAmount, { color: colors.foreground }]}>
                        {formatPrice(booking.rentalFee)}
                      </Text>
                    </View>
                    {idx < completedBookings.slice(0, 5).length - 1 && (
                      <View
                        style={[styles.divider, { backgroundColor: colors.border }]}
                      />
                    )}
                  </View>
                ))}
                {completedBookings.length > 5 && (
                  <Text
                    style={[styles.moreText, { color: colors.mutedForeground }]}
                  >
                    +{completedBookings.length - 5} pesanan lainnya
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingTop: 20,
    gap: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 13,
  },
  statsRowSmall: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  statCardSmall: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 2,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabelSmall: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 13,
  },
  section: {
    gap: 10,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: "auto",
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  emptyText: {
    fontSize: 13,
    flex: 1,
  },
  cardList: {
    gap: 10,
  },
  bookingCard: {
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  bookingTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  bookingInfo: {
    flex: 1,
    gap: 3,
  },
  bookingItemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  bookingRenter: {
    fontSize: 12,
  },
  bookingDates: {
    fontSize: 12,
  },
  bookingRight: {
    alignItems: "flex-end",
    gap: 1,
  },
  bookingAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  bookingAmountLabel: {
    fontSize: 10,
  },
  bookingActions: {
    flexDirection: "row",
    gap: 8,
  },
  declineBtn: {
    flex: 1,
    borderWidth: 1.5,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  activeCard: {
    borderWidth: 1,
    padding: 12,
  },
  activeCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemCard: {
    borderWidth: 1,
    padding: 12,
  },
  itemCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  itemRatingText: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  historyCard: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  historyItemName: {
    fontSize: 13,
    fontWeight: "600",
  },
  historyMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
  },
  moreText: {
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 8,
  },
});
