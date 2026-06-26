import { Feather } from "@expo/vector-icons";
import {
  useCreateBooking,
  useGetItem,
  useListItemReviews,
  useToggleFavorite,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function ItemDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [days, setDays] = useState(3);

  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: item, isLoading, error } = useGetItem(Number(id));
  const { data: reviewsData } = useListItemReviews(Number(id));
  const reviews = reviewsData?.reviews ?? [];

  const { mutate: toggleFav } = useToggleFavorite();

  const { mutate: createBooking, isPending: booking } = useCreateBooking({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Berhasil!",
          "Pesanan kamu sedang diproses. Silakan lanjut ke pembayaran.",
          [
            {
              text: "Lihat Pesanan",
              onPress: () => router.push("/(tabs)/bookings"),
            },
          ]
        );
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Gagal", "Gagal membuat pesanan. Coba lagi.");
      },
    },
  });

  const handleBook = () => {
    if (!user) {
      Alert.alert("Masuk Dulu", "Login terlebih dahulu untuk menyewa.", [
        { text: "Batal", style: "cancel" },
        { text: "Masuk", onPress: () => router.push("/login") },
      ]);
      return;
    }
    const startDate = addDays(new Date(), 1);
    const endDate = addDays(startDate, days - 1);
    createBooking({
      data: {
        itemId: Number(id),
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      },
    });
  };

  const formatPrice = (price: number) => `Rp${price.toLocaleString("id-ID")}`;

  if (isLoading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Item tidak ditemukan
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 8 }}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const rentalFee = item.pricePerDay * days;
  const serviceFee = Math.round(rentalFee * 0.05);
  const totalAmount = rentalFee + item.deposit + serviceFee;

  const categoryLabel = item.category === "buku" ? "Buku" : "Mainan";
  const statusOk = item.status === "available";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}
          >
            <Feather
              name={item.category === "buku" ? "book-open" : "gift"}
              size={64}
              color={colors.mutedForeground}
            />
          </View>
        )}

        {/* Back button overlaid on image */}
        <Pressable
          style={[
            styles.backBtn,
            {
              backgroundColor: colors.card + "e0",
              top: (Platform.OS === "web" ? 67 : insets.top) + 12,
            },
          ]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        {/* Content */}
        <View style={[styles.content, { paddingHorizontal: 16 }]}>
          {/* Title + Category */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Text style={[styles.categoryText, { color: colors.accentForeground }]}>
                  {categoryLabel}
                </Text>
              </View>
              <Text style={[styles.itemName, { color: colors.foreground }]}>
                {item.name}
              </Text>
            </View>
            <Pressable
              style={[
                styles.favBtn,
                { backgroundColor: colors.muted, borderRadius: colors.radius / 2 },
              ]}
              onPress={() => {
                if (!user) return;
                toggleFav({ id: item.id });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather
                name={item.isFavorited ? "heart" : "heart"}
                size={20}
                color={item.isFavorited ? colors.destructive : colors.mutedForeground}
              />
            </Pressable>
          </View>

          {/* Owner */}
          <View style={styles.ownerRow}>
            <View
              style={[
                styles.ownerAvatar,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.ownerInitial, { color: colors.primaryForeground }]}>
                {(item.ownerName ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.ownerName, { color: colors.foreground }]}>
                {item.ownerName ?? "Pemilik"}
              </Text>
              {item.ownerRating ? (
                <View style={styles.ratingRow}>
                  <Feather name="star" size={11} color={colors.warning} />
                  <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                    {item.ownerRating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>
            {item.location ? (
              <View style={[styles.locationRow, { marginLeft: "auto" }]}>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                  {item.location}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Status */}
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: statusOk ? colors.success + "15" : colors.warning + "15",
                borderRadius: colors.radius / 2,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusOk ? colors.success : colors.warning },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: statusOk ? colors.success : colors.warning },
              ]}
            >
              {statusOk ? "Tersedia untuk disewa" : "Sedang disewa"}
            </Text>
          </View>

          {/* Description */}
          {item.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Deskripsi
              </Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {item.description}
              </Text>
            </View>
          ) : null}

          {/* Duration Picker */}
          <View
            style={[
              styles.durationCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Durasi Sewa
            </Text>
            <View style={styles.durationRow}>
              {[1, 3, 7, 14, 30].map((d) => (
                <Pressable
                  key={d}
                  style={[
                    styles.durationPill,
                    {
                      backgroundColor: days === d ? colors.primary : colors.muted,
                      borderRadius: colors.radius / 2,
                    },
                  ]}
                  onPress={() => {
                    setDays(d);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.durationText,
                      {
                        color: days === d ? colors.primaryForeground : colors.foreground,
                      },
                    ]}
                  >
                    {d}h
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Ulasan
              </Text>
              {reviews.length > 0 && (
                <View style={styles.overallRating}>
                  <Feather name="star" size={14} color="#f59e0b" />
                  <Text style={[styles.overallRatingText, { color: colors.foreground }]}>
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </Text>
                  <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
                    ({reviews.length} ulasan)
                  </Text>
                </View>
              )}
            </View>

            {reviews.length === 0 ? (
              <View
                style={[
                  styles.noReviews,
                  { backgroundColor: colors.muted, borderRadius: colors.radius / 2 },
                ]}
              >
                <Feather name="message-circle" size={24} color={colors.mutedForeground} />
                <Text style={[styles.noReviewsText, { color: colors.mutedForeground }]}>
                  Belum ada ulasan. Jadilah yang pertama!
                </Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.slice(0, 3).map((review) => (
                  <View
                    key={review.id}
                    style={[
                      styles.reviewCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: colors.radius / 2,
                      },
                    ]}
                  >
                    <View style={styles.reviewTop}>
                      <View
                        style={[
                          styles.reviewAvatar,
                          { backgroundColor: colors.primary + "30" },
                        ]}
                      >
                        <Text style={[styles.reviewAvatarText, { color: colors.primary }]}>
                          {review.reviewerName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewMeta}>
                        <Text style={[styles.reviewerName, { color: colors.foreground }]}>
                          {review.reviewerName}
                        </Text>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Feather
                              key={s}
                              name="star"
                              size={11}
                              color="#f59e0b"
                              style={{ opacity: s <= review.rating ? 1 : 0.25 }}
                            />
                          ))}
                          <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                            {new Date(review.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {review.comment ? (
                      <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>
                        {review.comment}
                      </Text>
                    ) : null}
                  </View>
                ))}
                {reviews.length > 3 && (
                  <Text style={[styles.moreReviews, { color: colors.mutedForeground }]}>
                    +{reviews.length - 3} ulasan lainnya
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Cost Breakdown */}
          <View
            style={[
              styles.costCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Rincian Biaya
            </Text>
            {[
              { label: `Sewa (${days} hari × ${formatPrice(item.pricePerDay)})`, value: rentalFee },
              { label: "Deposit (dikembalikan)", value: item.deposit },
              { label: "Biaya Layanan (5%)", value: serviceFee },
            ].map(({ label, value }) => (
              <View key={label} style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.mutedForeground }]}>
                  {label}
                </Text>
                <Text style={[styles.costValue, { color: colors.foreground }]}>
                  {formatPrice(value)}
                </Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.costRow}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {formatPrice(totalAmount)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.cta,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPadding + 16,
          },
        ]}
      >
        <View style={styles.ctaPrice}>
          <Text style={[styles.ctaPriceValue, { color: colors.primary }]}>
            {formatPrice(item.pricePerDay)}
          </Text>
          <Text style={[styles.ctaPriceLabel, { color: colors.mutedForeground }]}>
            /hari
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.bookBtn,
            {
              backgroundColor: statusOk ? colors.primary : colors.mutedForeground,
              borderRadius: colors.radius / 2,
              opacity: pressed || !statusOk || booking ? 0.8 : 1,
            },
          ]}
          onPress={handleBook}
          disabled={!statusOk || booking}
        >
          {booking ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.bookBtnText, { color: colors.primaryForeground }]}>
              {statusOk ? "Sewa Sekarang" : "Tidak Tersedia"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  image: {
    width: "100%",
    height: 280,
  },
  imagePlaceholder: {
    width: "100%",
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  itemName: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  favBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ownerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInitial: {
    fontSize: 14,
    fontWeight: "700",
  },
  ownerName: {
    fontSize: 14,
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  durationCard: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  durationPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "600",
  },
  costCard: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costLabel: {
    fontSize: 13,
    flex: 1,
  },
  costValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  reviewsSection: {
    gap: 12,
    paddingHorizontal: 16,
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overallRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  overallRatingText: {
    fontSize: 14,
    fontWeight: "700",
  },
  reviewCount: {
    fontSize: 12,
  },
  noReviews: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  noReviewsText: {
    fontSize: 13,
    flex: 1,
  },
  reviewsList: {
    gap: 10,
  },
  reviewCard: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  reviewMeta: {
    flex: 1,
    gap: 3,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: "600",
  },
  reviewStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 19,
  },
  moreReviews: {
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 4,
  },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  ctaPrice: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  ctaPriceValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  ctaPriceLabel: {
    fontSize: 13,
  },
  bookBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 160,
    alignItems: "center",
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
