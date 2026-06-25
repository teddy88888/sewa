import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Category = "all" | "buku" | "mainan";

interface CategoryFilterProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

const categories: { key: Category; label: string; icon: string }[] = [
  { key: "all", label: "Semua", icon: "grid" },
  { key: "buku", label: "Buku", icon: "book-open" },
  { key: "mainan", label: "Mainan", icon: "gift" },
];

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isActive = selected === cat.key;
        return (
          <Pressable
            key={cat.key}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: isActive ? colors.primary : colors.card,
                borderColor: isActive ? colors.primary : colors.border,
                borderRadius: colors.radius,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => onSelect(cat.key)}
          >
            <Feather
              name={cat.icon as "grid" | "book-open" | "gift"}
              size={14}
              color={isActive ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.primaryForeground : colors.foreground,
                },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
