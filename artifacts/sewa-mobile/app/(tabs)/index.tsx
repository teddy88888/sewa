import { Feather } from "@expo/vector-icons";
import {
  useListFeaturedItems,
  useListItems,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ItemCard } from "@/components/ItemCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

type Category = "all" | "buku" | "mainan";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>("all");

  const topPadding =
    Platform.OS === "web" ? 67 : insets.top;

  const { data: featuredData, isLoading: featuredLoading } =
    useListFeaturedItems();

  const { data: itemsData, isLoading: itemsLoading } = useListItems({
    category: category === "all" ? undefined : category,
    limit: 20,
  });

  const featured = featuredData ?? [];
  const items = itemsData?.items ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: topPadding + 16,
          paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {user ? `Halo, ${user.name.split(" ")[0]} 👋` : "Selamat datang!"}
          </Text>
          <Text style={[styles.tagline, { color: colors.foreground }]}>
            Sewa Buku & Mainan Anak
          </Text>
        </View>
        {user ? (
          <Pressable
            style={[
              styles.avatarBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={[styles.avatarInitial, { color: colors.primaryForeground }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.loginBtn,
              { backgroundColor: colors.primary, borderRadius: colors.radius / 2 },
            ]}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>
              Masuk
            </Text>
          </Pressable>
        )}
      </View>

      {/* Search Bar */}
      <Pressable
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
        onPress={() => router.push("/(tabs)/explore")}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
          Cari buku atau mainan...
        </Text>
      </Pressable>

      {/* Featured */}
      {featuredLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : featured.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Rekomendasi
            </Text>
          </View>
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={!!featured.length}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onPress={() => router.push(`/item/${item.id}`)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />
        </View>
      ) : null}

      {/* Browse by Category */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Jelajahi
          </Text>
        </View>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </View>

      {/* Items List */}
      <View style={[styles.section, { paddingHorizontal: 16 }]}>
        {itemsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tidak ada item ditemukan
            </Text>
          </View>
        ) : (
          <View style={styles.itemsGrid}>
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/item/${item.id}`)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
  },
  tagline: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: "700",
  },
  loginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
});
