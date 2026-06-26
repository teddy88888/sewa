import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useNotificationInbox } from "@/context/NotificationContext";

const STAR_LABELS = ["", "Sangat Buruk", "Buruk", "Cukup", "Bagus", "Sangat Bagus"];

function StarRow({
  value,
  onChange,
  size = 40,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const colors = useColors();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => {
            onChange(star);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          hitSlop={8}
        >
          <Feather
            name={star <= value ? "star" : "star"}
            size={size}
            color={star <= value ? "#f59e0b" : colors.border}
            style={{
              // Fill vs outline via color — expo vector-icons "star" is always filled
              opacity: star <= value ? 1 : 0.3,
            }}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function ReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookingId, itemName } = useLocalSearchParams<{
    bookingId: string;
    itemName: string;
  }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { addNotification } = useNotificationInbox();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Pilih bintang", "Berikan rating bintang terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      const { createReview } = await import("@workspace/api-client-react");
      await createReview({ bookingId: Number(bookingId), rating, comment: comment || undefined });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addNotification({
        type: "general",
        title: "Ulasan Terkirim! ⭐",
        body: `Terima kasih telah memberikan ulasan untuk "${itemName ?? "item"}". Rating ${rating}/5 kamu sangat berarti!`,
      });
      setDone(true);
    } catch (err: any) {
      const msg =
        err?.message?.includes("409") || err?.response?.status === 409
          ? "Kamu sudah memberikan ulasan untuk pesanan ini."
          : "Gagal mengirim ulasan. Coba lagi.";
      Alert.alert("Gagal", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (done) {
    return (
      <View
        style={[
          styles.successScreen,
          {
            backgroundColor: colors.background,
            paddingTop: topPadding,
            paddingBottom: bottomPadding + 32,
          },
        ]}
      >
        <View style={[styles.successIcon, { backgroundColor: "#f59e0b20" }]}>
          <Text style={styles.successEmoji}>⭐</Text>
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Ulasan Terkirim!
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Terima kasih! Ulasanmu membantu pemilik dan penyewa lain membuat keputusan yang lebih baik.
        </Text>
        <View style={styles.ratingDisplay}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Feather
              key={s}
              name="star"
              size={28}
              color="#f59e0b"
              style={{ opacity: s <= rating ? 1 : 0.25 }}
            />
          ))}
        </View>
        <Pressable
          style={[
            styles.doneBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius / 2 },
          ]}
          onPress={() => router.replace("/(tabs)/bookings")}
        >
          <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>
            Lihat Pesanan Saya
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Beri Ulasan
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {itemName ?? "Item"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: bottomPadding + 110 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Rating section */}
        <View
          style={[
            styles.ratingCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Rating
          </Text>
          <Text style={[styles.ratingHint, { color: colors.mutedForeground }]}>
            Seberapa puas kamu menyewa item ini?
          </Text>

          <StarRow value={rating} onChange={setRating} size={44} />

          {rating > 0 && (
            <View
              style={[
                styles.ratingLabel,
                { backgroundColor: "#f59e0b18", borderRadius: 8 },
              ]}
            >
              <Text style={[styles.ratingLabelText, { color: "#f59e0b" }]}>
                ★ {STAR_LABELS[rating]}
              </Text>
            </View>
          )}
        </View>

        {/* Comment section */}
        <View
          style={[
            styles.commentCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.commentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ceritakan Pengalamanmu
            </Text>
            <Text style={[styles.optional, { color: colors.mutedForeground }]}>
              (opsional)
            </Text>
          </View>
          <Text style={[styles.commentHint, { color: colors.mutedForeground }]}>
            Kondisi item, pelayanan pemilik, kemudahan proses sewa, dll.
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: colors.border,
                borderRadius: colors.radius / 2,
              },
            ]}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            placeholder="Ceritakan pengalamanmu menyewa item ini..."
            placeholderTextColor={colors.mutedForeground}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
            {comment.length}/1000
          </Text>
        </View>

        {/* Tips */}
        <View
          style={[
            styles.tipsCard,
            { backgroundColor: colors.accent, borderRadius: colors.radius / 2 },
          ]}
        >
          <View style={styles.tipsHeader}>
            <Feather name="info" size={14} color={colors.accentForeground} />
            <Text style={[styles.tipsTitle, { color: colors.accentForeground }]}>
              Tips Ulasan yang Baik
            </Text>
          </View>
          {[
            "Jelaskan kondisi item saat tiba dan dikembalikan",
            "Ceritakan bagaimana pemilik merespons pesanan",
            "Bantu penyewa lain dengan pengalaman jujurmu",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View
                style={[
                  styles.tipDot,
                  { backgroundColor: colors.accentForeground },
                ]}
              />
              <Text style={[styles.tipText, { color: colors.accentForeground }]}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Submit button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPadding + 16,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor:
                rating === 0 || submitting
                  ? colors.mutedForeground
                  : colors.primary,
              borderRadius: colors.radius / 2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Feather
                name="send"
                size={16}
                color={colors.primaryForeground}
              />
              <Text
                style={[styles.submitBtnText, { color: colors.primaryForeground }]}
              >
                {rating === 0 ? "Pilih Rating Dulu" : "Kirim Ulasan"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 4,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerSub: { fontSize: 14 },
  body: { padding: 16, gap: 16 },
  ratingCard: {
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  ratingHint: { fontSize: 13, textAlign: "center" },
  starRow: { flexDirection: "row", gap: 8, marginVertical: 4 },
  ratingLabel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 4,
  },
  ratingLabelText: { fontSize: 15, fontWeight: "700" },
  commentCard: { padding: 16, borderWidth: 1, gap: 8 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  optional: { fontSize: 12 },
  commentHint: { fontSize: 12, lineHeight: 18 },
  textInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    lineHeight: 20,
  },
  charCount: { fontSize: 11, textAlign: "right" },
  tipsCard: { padding: 14, gap: 8 },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  tipsTitle: { fontSize: 13, fontWeight: "600" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  tipText: { fontSize: 12, flex: 1, lineHeight: 18 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  submitBtnText: { fontSize: 15, fontWeight: "700" },
  successScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  successSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  ratingDisplay: { flexDirection: "row", gap: 6, marginVertical: 8 },
  doneBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    marginTop: 8,
  },
  doneBtnText: { fontSize: 15, fontWeight: "700" },
});
