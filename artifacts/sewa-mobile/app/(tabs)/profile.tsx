import { Feather } from "@expo/vector-icons";
import { useGetWallet } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : 100;

  const { data: wallet, isLoading: walletLoading } = useGetWallet({
    enabled: !!user,
  });

  const handleSignOut = () => {
    Alert.alert("Keluar", "Apakah kamu yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const formatPrice = (price: number) =>
    `Rp${price.toLocaleString("id-ID")}`;

  if (!user) {
    return (
      <View
        style={[
          styles.authRequired,
          {
            backgroundColor: colors.background,
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        <View
          style={[
            styles.avatarLarge,
            { backgroundColor: colors.muted },
          ]}
        >
          <Feather name="user" size={48} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.authTitle, { color: colors.foreground }]}>
          Belum Masuk
        </Text>
        <Text style={[styles.authText, { color: colors.mutedForeground }]}>
          Masuk untuk melihat profil dan kelola akun kamu
        </Text>
        <Pressable
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          onPress={() => router.push("/login")}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
            Masuk
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/register")}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Belum punya akun? Daftar
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: topPadding + 16, paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar & Name */}
      <View style={styles.profileHeader}>
        <View
          style={[
            styles.avatarLarge,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.avatarInitial, { color: colors.primaryForeground }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.foreground }]}>
          {user.name}
        </Text>
        <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
          {user.email}
        </Text>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: colors.accent },
          ]}
        >
          <Text style={[styles.roleText, { color: colors.accentForeground }]}>
            {user.role === "penyewa" ? "Penyewa" : user.role === "pemilik" ? "Pemilik" : "Admin"}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {user.totalTransactions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Transaksi
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {user.rating ? user.rating.toFixed(1) : "–"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Rating
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatPrice(user.depositBalance)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Deposit
          </Text>
        </View>
      </View>

      {/* Wallet Card */}
      {walletLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : wallet ? (
        <View
          style={[
            styles.walletCard,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <View style={styles.walletHeader}>
            <Feather name="credit-card" size={18} color={colors.primaryForeground} />
            <Text style={[styles.walletTitle, { color: colors.primaryForeground }]}>
              Dompet
            </Text>
          </View>
          <Text style={[styles.walletBalance, { color: colors.primaryForeground }]}>
            {formatPrice(wallet.availableBalance)}
          </Text>
          <Text style={[styles.walletSub, { color: colors.primaryForeground + "cc" }]}>
            Tersedia · {formatPrice(wallet.heldAmount)} ditahan
          </Text>
        </View>
      ) : null}

      {/* Menu */}
      <View
        style={[
          styles.menuCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {[
          { icon: "shopping-bag", label: "Pesanan Saya", onPress: () => router.push("/(tabs)/bookings") },
          { icon: "box", label: "Item Saya", onPress: () => {} },
          { icon: "heart", label: "Favorit", onPress: () => {} },
          { icon: "bell", label: "Notifikasi", onPress: () => {} },
        ].map((item, index, arr) => (
          <View key={item.label}>
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={item.onPress}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Feather
                  name={item.icon as "shopping-bag"}
                  size={16}
                  color={colors.accentForeground}
                />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
            {index < arr.length - 1 && (
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </View>

      {/* Sign Out */}
      <Pressable
        style={({ pressed }) => [
          styles.signOutBtn,
          {
            backgroundColor: colors.destructive + "10",
            borderColor: colors.destructive + "30",
            borderRadius: colors.radius,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={handleSignOut}
      >
        <Feather name="log-out" size={16} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>
          Keluar
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  profileHeader: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "700",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 13,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsCard: {
    flexDirection: "row",
    borderWidth: 1,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  walletCard: {
    padding: 20,
    gap: 4,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  walletTitle: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.9,
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: "700",
  },
  walletSub: {
    fontSize: 12,
    marginTop: 2,
  },
  menuCard: {
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    marginLeft: 60,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
  },
  signOutText: {
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
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  authText: {
    fontSize: 14,
    textAlign: "center",
  },
  primaryBtn: {
    paddingHorizontal: 40,
    paddingVertical: 13,
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
