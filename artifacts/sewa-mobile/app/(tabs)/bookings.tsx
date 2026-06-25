import { Feather } from "@expo/vector-icons";
import { useListBookings } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookingCard } from "@/components/BookingCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

type StatusFilter = "all" | "pending" | "active" | "completed";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Selesai" },
];

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { data: bookings, isLoading } = useListBookings(
    { status: filter === "all" ? undefined : filter },
    { enabled: !!user }
  );

  if (!user) {
    return (
      <View
        style={[
          styles.authRequired,
          {
            backgroundColor: colors.background,
            paddingTop: topPadding,
          },
        ]}
      >
        <Feather name="lock" size={48} color={colors.mutedForeground} />
        <Text style={[styles.authTitle, { color: colors.foreground }]}>
          Masuk untuk Melihat Pesanan
        </Text>
        <Text style={[styles.authText, { color: colors.mutedForeground }]}>
          Login untuk melihat riwayat penyewaan kamu
        </Text>
        <Pressable
          style={[
            styles.loginBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          onPress={() => router.push("/login")}
        >
          <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>
            Masuk
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 16,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Pesanan</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderRadius: colors.radius / 2,
                  },
                ]}
                onPress={() => setFilter(f.key)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isActive
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={bookings ?? []}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 },
          ]}
          scrollEnabled={!!(bookings ?? []).length}
          renderItem={({ item }) => (
            <BookingCard booking={item} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Belum Ada Pesanan
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Mulai sewa buku atau mainan favoritmu
              </Text>
              <Pressable
                style={[
                  styles.exploreBtn,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                ]}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={[styles.exploreBtnText, { color: colors.primaryForeground }]}>
                  Jelajahi Sekarang
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    padding: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  exploreBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  authRequired: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  authText: {
    fontSize: 14,
    textAlign: "center",
  },
  loginBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 8,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
