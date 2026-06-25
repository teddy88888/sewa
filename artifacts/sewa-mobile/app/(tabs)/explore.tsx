import { Feather } from "@expo/vector-icons";
import { useListItems } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ItemCard } from "@/components/ItemCard";
import { useColors } from "@/hooks/useColors";

type Category = "all" | "buku" | "mainan";

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading } = useListItems({
    category: category === "all" ? undefined : category,
    search: debouncedSearch || undefined,
    limit: 50,
  });

  const items = data?.items ?? [];

  const handleSearchChange = (text: string) => {
    setSearch(text);
    clearTimeout((handleSearchChange as { _timer?: ReturnType<typeof setTimeout> })._timer);
    const timer = setTimeout(() => setDebouncedSearch(text), 400);
    (handleSearchChange as { _timer?: ReturnType<typeof setTimeout> })._timer = timer;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            paddingTop: topPadding + 16,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Cari</Text>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Cari buku atau mainan..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Feather
              name="x"
              size={16}
              color={colors.mutedForeground}
              onPress={() => {
                setSearch("");
                setDebouncedSearch("");
              }}
            />
          )}
        </View>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </View>

      {/* Results */}
      {isLoading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
            },
          ]}
          scrollEnabled={!!items.length}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              horizontal
              onPress={() => router.push(`/item/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 10 }} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Tidak Ada Hasil
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Coba kata kunci yang berbeda
              </Text>
            </View>
          }
          ListHeaderComponent={
            items.length > 0 ? (
              <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                {data?.total ?? items.length} hasil ditemukan
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingBottom: 8,
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  resultCount: {
    fontSize: 12,
    marginBottom: 8,
  },
});
