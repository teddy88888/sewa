import { Feather } from "@expo/vector-icons";
import { useCreateItem } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "@/context/AuthContext";

type Category = "buku" | "mainan";

interface FormState {
  name: string;
  category: Category;
  description: string;
  pricePerDay: string;
  deposit: string;
  location: string;
  imageUrl: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  category: "buku",
  description: "",
  pricePerDay: "",
  deposit: "",
  location: "",
  imageUrl: "",
};

function formatRp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

function parseRp(formatted: string): number {
  return Number(formatted.replace(/\./g, "").replace(/,/g, "")) || 0;
}

export default function DaftarItemScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [step, setStep] = useState<1 | 2>(1);

  const descRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const depositRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { mutate: createItem, isPending } = useCreateItem({
    mutation: {
      onSuccess: (item) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/profile");
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrors({ name: "Gagal menyimpan item. Coba lagi." });
      },
    },
  });

  const set = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep1 = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = "Nama item wajib diisi";
    if (!form.description.trim()) errs.description = "Deskripsi wajib diisi";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.pricePerDay || parseRp(form.pricePerDay) <= 0)
      errs.pricePerDay = "Harga sewa per hari wajib diisi";
    if (!form.deposit || parseRp(form.deposit) <= 0)
      errs.deposit = "Deposit wajib diisi";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(2);
  };

  const handleSubmit = () => {
    if (!validateStep2()) return;
    createItem({
      data: {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        pricePerDay: parseRp(form.pricePerDay),
        deposit: parseRp(form.deposit),
        location: form.location.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
      },
    });
  };

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.centerText, { color: colors.foreground }]}>
          Harap login terlebih dahulu
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Daftarkan Item
        </Text>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2].map((s) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    s <= step ? colors.primary : colors.border,
                  width: s === step ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: bottomPadding + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <>
            {/* Step 1: Info Dasar */}
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Informasi Dasar
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Ceritakan tentang item yang ingin kamu sewakan
            </Text>

            {/* Category Toggle */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Kategori
              </Text>
              <View style={[styles.categoryToggle, { backgroundColor: colors.muted, borderRadius: colors.radius / 2 }]}>
                {(["buku", "mainan"] as Category[]).map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor:
                          form.category === cat ? colors.primary : "transparent",
                        borderRadius: colors.radius / 2 - 2,
                      },
                    ]}
                    onPress={() => {
                      set("category")(cat);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Feather
                      name={cat === "buku" ? "book-open" : "gift"}
                      size={16}
                      color={
                        form.category === cat
                          ? colors.primaryForeground
                          : colors.mutedForeground
                      }
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        {
                          color:
                            form.category === cat
                              ? colors.primaryForeground
                              : colors.foreground,
                        },
                      ]}
                    >
                      {cat === "buku" ? "Buku" : "Mainan"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Nama Item <Text style={{ color: colors.destructive }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.name ? colors.destructive : colors.border,
                    borderRadius: colors.radius / 2,
                    color: colors.foreground,
                  },
                ]}
                placeholder={
                  form.category === "buku"
                    ? "Contoh: Harry Potter and the Sorcerer's Stone"
                    : "Contoh: Lego Duplo Creative Box"
                }
                placeholderTextColor={colors.mutedForeground}
                value={form.name}
                onChangeText={set("name")}
                returnKeyType="next"
                onSubmitEditing={() => descRef.current?.focus()}
              />
              {errors.name ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {errors.name}
                </Text>
              ) : null}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Deskripsi <Text style={{ color: colors.destructive }}>*</Text>
              </Text>
              <TextInput
                ref={descRef}
                style={[
                  styles.input,
                  styles.textarea,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.description ? colors.destructive : colors.border,
                    borderRadius: colors.radius / 2,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Ceritakan kondisi, usia yang sesuai, dan informasi lain yang berguna untuk penyewa..."
                placeholderTextColor={colors.mutedForeground}
                value={form.description}
                onChangeText={set("description")}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
              {errors.description ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {errors.description}
                </Text>
              ) : null}
            </View>

            {/* Image URL (optional) */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                URL Foto{" "}
                <Text style={[styles.optional, { color: colors.mutedForeground }]}>
                  (opsional)
                </Text>
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius / 2,
                  },
                ]}
              >
                <Feather name="image" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.inputRowText, { color: colors.foreground }]}
                  placeholder="https://..."
                  placeholderTextColor={colors.mutedForeground}
                  value={form.imageUrl}
                  onChangeText={set("imageUrl")}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Step 2: Harga & Lokasi */}
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Harga & Lokasi
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Tentukan harga sewa dan deposit untuk item kamu
            </Text>

            {/* Pricing Guide */}
            <View
              style={[
                styles.guideCard,
                {
                  backgroundColor: colors.accent,
                  borderRadius: colors.radius / 2,
                },
              ]}
            >
              <Feather name="info" size={14} color={colors.accentForeground} />
              <Text style={[styles.guideText, { color: colors.accentForeground }]}>
                Tips: Harga sewa buku umumnya Rp5.000–Rp20.000/hari, mainan Rp15.000–Rp50.000/hari. Deposit biasanya 3–5× harga sewa harian.
              </Text>
            </View>

            {/* Price per day */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Harga Sewa per Hari{" "}
                <Text style={{ color: colors.destructive }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.pricePerDay
                      ? colors.destructive
                      : colors.border,
                    borderRadius: colors.radius / 2,
                  },
                ]}
              >
                <Text
                  style={[styles.currencyPrefix, { color: colors.mutedForeground }]}
                >
                  Rp
                </Text>
                <TextInput
                  ref={priceRef}
                  style={[styles.inputRowText, { color: colors.foreground }]}
                  placeholder="15.000"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.pricePerDay}
                  onChangeText={(text) =>
                    set("pricePerDay")(formatRp(text))
                  }
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => depositRef.current?.focus()}
                />
                <Text style={[styles.perDay, { color: colors.mutedForeground }]}>
                  /hari
                </Text>
              </View>
              {errors.pricePerDay ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {errors.pricePerDay}
                </Text>
              ) : null}
            </View>

            {/* Deposit */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Deposit{" "}
                <Text style={{ color: colors.destructive }}>*</Text>
              </Text>
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                Dikembalikan setelah item dikembalikan dalam kondisi baik
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: errors.deposit ? colors.destructive : colors.border,
                    borderRadius: colors.radius / 2,
                  },
                ]}
              >
                <Text
                  style={[styles.currencyPrefix, { color: colors.mutedForeground }]}
                >
                  Rp
                </Text>
                <TextInput
                  ref={depositRef}
                  style={[styles.inputRowText, { color: colors.foreground }]}
                  placeholder="50.000"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.deposit}
                  onChangeText={(text) => set("deposit")(formatRp(text))}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => locationRef.current?.focus()}
                />
              </View>
              {errors.deposit ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {errors.deposit}
                </Text>
              ) : null}
            </View>

            {/* Location */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Lokasi{" "}
                <Text style={[styles.optional, { color: colors.mutedForeground }]}>
                  (opsional)
                </Text>
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius / 2,
                  },
                ]}
              >
                <Feather name="map-pin" size={16} color={colors.mutedForeground} />
                <TextInput
                  ref={locationRef}
                  style={[styles.inputRowText, { color: colors.foreground }]}
                  placeholder="Bandung, Jawa Barat"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.location}
                  onChangeText={set("location")}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Summary Preview */}
            {form.pricePerDay && form.deposit ? (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                  Ringkasan Item
                </Text>
                <View style={styles.summaryRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Feather
                      name={form.category === "buku" ? "book-open" : "gift"}
                      size={12}
                      color={colors.accentForeground}
                    />
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: colors.accentForeground },
                      ]}
                    >
                      {form.category === "buku" ? "Buku" : "Mainan"}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.summaryName, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {form.name || "Nama item"}
                </Text>
                <View style={styles.summaryPriceRow}>
                  <Text style={[styles.summaryPrice, { color: colors.primary }]}>
                    Rp{form.pricePerDay}
                  </Text>
                  <Text style={[styles.summaryPerDay, { color: colors.mutedForeground }]}>
                    /hari
                  </Text>
                  <Text style={[styles.summaryDeposit, { color: colors.mutedForeground }]}>
                    · Deposit Rp{form.deposit}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
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
        {step === 2 && (
          <Pressable
            style={[
              styles.backStepBtn,
              {
                borderColor: colors.border,
                borderRadius: colors.radius / 2,
              },
            ]}
            onPress={() => setStep(1)}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: isPending ? colors.primary + "80" : colors.primary,
              borderRadius: colors.radius / 2,
              opacity: pressed ? 0.85 : 1,
              flex: 1,
            },
          ]}
          onPress={step === 1 ? handleNext : handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <View style={styles.btnInner}>
              <Text
                style={[styles.primaryBtnText, { color: colors.primaryForeground }]}
              >
                {step === 1 ? "Lanjut" : "Daftarkan Sekarang"}
              </Text>
              <Feather
                name={step === 1 ? "arrow-right" : "check"}
                size={16}
                color={colors.primaryForeground}
              />
            </View>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    fontSize: 16,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  closeBtn: {
    alignSelf: "flex-start",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  stepIndicator: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  body: {
    padding: 20,
    gap: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  stepSubtitle: {
    fontSize: 13,
    marginTop: -12,
    lineHeight: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  fieldHint: {
    fontSize: 12,
    marginTop: -2,
  },
  optional: {
    fontWeight: "400",
    fontSize: 12,
  },
  categoryToggle: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
  },
  categoryOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputRowText: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: "600",
  },
  perDay: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 12,
    marginTop: -2,
  },
  guideCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
  },
  guideText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  summaryCard: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 6,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  summaryName: {
    fontSize: 16,
    fontWeight: "600",
  },
  summaryPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  summaryPerDay: {
    fontSize: 12,
  },
  summaryDeposit: {
    fontSize: 12,
    marginLeft: 4,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  backStepBtn: {
    width: 48,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  primaryBtn: {
    paddingVertical: 15,
    alignItems: "center",
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
