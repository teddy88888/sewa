import { Feather } from "@expo/vector-icons";
import type { Item } from "@workspace/api-client-react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ItemCardProps {
  item: Item;
  onPress: () => void;
  horizontal?: boolean;
}

export function ItemCard({ item, onPress, horizontal = false }: ItemCardProps) {
  const colors = useColors();

  const formatPrice = (price: number) => {
    return `Rp${price.toLocaleString("id-ID")}`;
  };

  const categoryLabel = item.category === "buku" ? "Buku" : "Mainan";
  const categoryColor = item.category === "buku" ? colors.info : colors.secondary;
  const statusColor =
    item.status === "available"
      ? colors.success
      : item.status === "rented"
        ? colors.warning
        : colors.mutedForeground;
  const statusLabel =
    item.status === "available"
      ? "Tersedia"
      : item.status === "rented"
        ? "Disewa"
        : "Pending";

  if (horizontal) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.horizontalCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={onPress}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={[
              styles.horizontalImage,
              { borderRadius: colors.radius - 2 },
            ]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.horizontalImagePlaceholder,
              { backgroundColor: colors.muted, borderRadius: colors.radius - 2 },
            ]}
          >
            <Feather
              name={item.category === "buku" ? "book-open" : "gift"}
              size={28}
              color={colors.mutedForeground}
            />
          </View>
        )}
        <View style={styles.horizontalContent}>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "20" }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {categoryLabel}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text
            style={[styles.itemName, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.location ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={10} color={colors.mutedForeground} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatPrice(item.pricePerDay)}
            </Text>
            <Text style={[styles.perDay, { color: colors.mutedForeground }]}>/hari</Text>
          </View>
          {item.rating ? (
            <View style={styles.ratingRow}>
              <Feather name="star" size={11} color={colors.warning} />
              <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                {item.rating.toFixed(1)} ({item.reviewCount})
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={[
            styles.image,
            { borderTopLeftRadius: colors.radius, borderTopRightRadius: colors.radius },
          ]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.imagePlaceholder,
            {
              backgroundColor: colors.muted,
              borderTopLeftRadius: colors.radius,
              borderTopRightRadius: colors.radius,
            },
          ]}
        >
          <Feather
            name={item.category === "buku" ? "book-open" : "gift"}
            size={36}
            color={colors.mutedForeground}
          />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "20" }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {categoryLabel}
            </Text>
          </View>
          {item.status !== "available" && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.categoryText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.itemName, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.location ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={10} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(item.pricePerDay)}
          </Text>
          <Text style={[styles.perDay, { color: colors.mutedForeground }]}>/hari</Text>
        </View>
        {item.rating ? (
          <View style={styles.ratingRow}>
            <Feather name="star" size={11} color={colors.warning} />
            <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
              {item.rating.toFixed(1)} ({item.reviewCount})
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 120,
  },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 10,
    gap: 4,
  },
  horizontalCard: {
    flexDirection: "row",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalImage: {
    width: 100,
    height: 110,
  },
  horizontalImagePlaceholder: {
    width: 100,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalContent: {
    flex: 1,
    padding: 10,
    gap: 4,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: 10,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  perDay: {
    fontSize: 10,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 10,
  },
});
