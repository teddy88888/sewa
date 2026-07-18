import { Feather } from "@expo/vector-icons";
import {
  useListMessages,
  useSendMessage,
  useMarkMessagesRead,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hari ini";
  if (d.toDateString() === yesterday.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { bookingId, itemName, otherName } = useLocalSearchParams<{
    bookingId: string;
    itemName?: string;
    otherName?: string;
  }>();

  const [text, setText] = useState("");
  const flatRef = useRef<FlatList>(null);
  const topPadding = Platform.OS === "web" ? 20 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 20 : insets.bottom;

  const {
    data,
    isLoading,
    refetch,
  } = useListMessages(Number(bookingId), {
    query: { enabled: !!bookingId && !!user, refetchInterval: 5000 },
  });

  const messages = data?.messages ?? [];

  const { mutate: markRead } = useMarkMessagesRead();

  const { mutate: send, isPending: sending } = useSendMessage({
    mutation: {
      onSuccess: () => {
        setText("");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        qc.invalidateQueries({ queryKey: ["/bookings", bookingId, "messages"] });
        refetch();
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      },
    },
  });

  useEffect(() => {
    if (messages.length > 0) {
      markRead({ id: Number(bookingId) });
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    send({ id: Number(bookingId), data: { content: trimmed } });
  };

  // Group messages by day
  type MsgItem =
    | { type: "date"; label: string; key: string }
    | { type: "msg"; msg: (typeof messages)[0]; key: string };

  const items: MsgItem[] = [];
  let lastDate = "";
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) {
      items.push({ type: "date", label: formatDateLabel(msg.createdAt), key: `date-${msg.createdAt}` });
      lastDate = d;
    }
    items.push({ type: "msg", msg, key: `msg-${msg.id}` });
  }

  const renderItem = ({ item }: { item: MsgItem }) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateLabelRow}>
          <Text style={[styles.dateLabelText, { color: colors.mutedForeground }]}>
            {item.label}
          </Text>
        </View>
      );
    }

    const { msg } = item;
    const isMine = msg.senderId === user?.id;

    return (
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <View
          style={[
            styles.bubbleBody,
            isMine
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isMine ? "#fff" : colors.foreground },
            ]}
          >
            {msg.content}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              { color: isMine ? "rgba(255,255,255,0.65)" : colors.mutedForeground },
            ]}
          >
            {formatTime(msg.createdAt)}
            {isMine && (
              <Text> {msg.isRead ? "✓✓" : "✓"}</Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 10,
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
        <View style={styles.headerInfo}>
          <View
            style={[styles.headerAvatar, { backgroundColor: colors.primary + "30" }]}
          >
            <Text style={[styles.headerAvatarText, { color: colors.primary }]}>
              {(otherName ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.foreground }]}>
              {otherName ?? "Chat"}
            </Text>
            {itemName ? (
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                {itemName}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Feather name="message-circle" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Belum ada pesan
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tanya soal kondisi item, lokasi penjemputan, dll.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={items}
            keyExtractor={(i) => i.key}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomPadding + 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderRadius: 22,
              },
            ]}
            placeholder="Ketik pesan..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: text.trim() ? colors.primary : colors.muted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather
                name="send"
                size={18}
                color={text.trim() ? "#fff" : colors.mutedForeground}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerName: {
    fontSize: 15,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 4,
  },
  dateLabelRow: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dateLabelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bubble: {
    marginVertical: 3,
  },
  bubbleMine: {
    alignItems: "flex-end",
  },
  bubbleTheirs: {
    alignItems: "flex-start",
  },
  bubbleBody: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 3,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 10,
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
