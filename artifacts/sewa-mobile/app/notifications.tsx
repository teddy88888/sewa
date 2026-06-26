import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { type InboxItem, type NotifType, useNotificationInbox } from "@/context/NotificationContext";

const TYPE_CONFIG: Record<
  NotifType,
  { icon: string; color: string; label: string }
> = {
  payment_success: { icon: "check-circle", color: "#22c55e", label: "Pembayaran" },
  new_booking: { icon: "package", color: "#3b82f6", label: "Pesanan Baru" },
  return_reminder: { icon: "clock", color: "#f59e0b", label: "Pengingat" },
  general: { icon: "bell", color: "#6b7280", label: "Info" },
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function NotifRow({ item, onPress }: { item: InboxItem; onPress: () => void }) {
  const colors = useColors();
  const cfg = TYPE_CONFIG[item.type];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: item.read ? colors.card : colors.primary + "08",
          borderBottomColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
    >
      {/* Unread dot */}
      {!item.read && (
        <View
          style={[styles.unreadDot, { backgroundColor: colors.primary }]}
        />
      )}

      {/* Icon */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: cfg.color + "18", borderRadius: 12 },
        ]}
      >
        <Feather name={cfg.icon as "bell"} size={18} color={cfg.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color: colors.foreground,
                fontWeight: item.read ? "500" : "700",
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(item.timestamp)}
          </Text>
        </View>
        <Text
          style={[styles.body, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: cfg.color + "18" },
          ]}
        >
          <Text style={[styles.typeLabel, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, markAsRead, markAllRead, clearAll } =
    useNotificationInbox();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Notifikasi
          </Text>
          {unread > 0 && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.unreadBadgeText,
                  { color: colors.primaryForeground },
                ]}
              >
                {unread}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unread > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.accent,
                  borderRadius: 8,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={markAllRead}
            >
              <Feather name="check-square" size={14} color={colors.accentForeground} />
              <Text style={[styles.actionBtnText, { color: colors.accentForeground }]}>
                Baca semua
              </Text>
            </Pressable>
          )}
          {notifications.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.destructive + "12",
                  borderRadius: 8,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={clearAll}
            >
              <Feather name="trash-2" size={14} color={colors.destructive} />
              <Text style={[styles.actionBtnText, { color: colors.destructive }]}>
                Hapus
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotifRow item={item} onPress={() => markAsRead(item.id)} />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPadding + 20 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.muted, borderRadius: 40 },
              ]}
            >
              <Feather name="bell-off" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Belum ada notifikasi
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Notifikasi pembayaran, pesanan baru, dan pengingat pengembalian akan muncul di sini.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    alignSelf: "flex-start",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    left: 4,
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    flexShrink: 0,
    marginTop: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 14,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
