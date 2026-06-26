import { Feather } from "@expo/vector-icons";
import {
  useGetBooking,
  useCreatePayment,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import {
  schedulePaymentSuccessNotification,
  scheduleReturnReminderNotification,
} from "@/hooks/useNotifications";
import { useNotificationInbox } from "@/context/NotificationContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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

type PaymentMethod = "bank_transfer" | "gopay" | "ovo" | "dana";

const METHODS: {
  id: PaymentMethod;
  label: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  {
    id: "gopay",
    label: "GoPay",
    icon: "zap",
    color: "#00AED6",
    description: "Bayar instan via GoPay",
  },
  {
    id: "ovo",
    label: "OVO",
    icon: "credit-card",
    color: "#4C3494",
    description: "Bayar instan via OVO",
  },
  {
    id: "dana",
    label: "DANA",
    icon: "dollar-sign",
    color: "#118EEA",
    description: "Bayar instan via DANA",
  },
  {
    id: "bank_transfer",
    label: "Transfer Bank",
    icon: "landmark",
    color: "#374151",
    description: "BCA, Mandiri, BNI, BRI",
  },
];

function formatRp(amount: number) {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [paid, setPaid] = useState(false);
  const { addNotification } = useNotificationInbox();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: booking, isLoading } = useGetBooking(Number(bookingId));

  const { mutate: createPayment, isPending } = useCreatePayment({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPaid(true);
        if (booking) {
          const formattedAmount = `Rp${booking.totalAmount.toLocaleString("id-ID")}`;
          const formattedDate = new Date(booking.startDate).toLocaleDateString("id-ID", {
            day: "numeric", month: "long",
          });
          addNotification({
            type: "payment_success",
            title: "Pembayaran Berhasil! 🎉",
            body: `${booking.itemName} siap disewa mulai ${formattedDate}. Total: ${formattedAmount}`,
          });
          schedulePaymentSuccessNotification({
            itemName: booking.itemName,
            totalAmount: booking.totalAmount,
            startDate: booking.startDate,
          });
          scheduleReturnReminderNotification({
            itemName: booking.itemName,
            endDate: booking.endDate,
          });
        }
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Gagal", "Pembayaran gagal diproses. Coba lagi.");
      },
    },
  });

  const handlePay = () => {
    if (!selected || !booking) return;
    Alert.alert(
      "Konfirmasi Pembayaran",
      `Bayar ${formatRp(booking.totalAmount)} via ${METHODS.find((m) => m.id === selected)?.label}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Bayar",
          onPress: () =>
            createPayment({
              data: { bookingId: Number(bookingId), method: selected },
            }),
        },
      ]
    );
  };

  // Success state
  if (paid) {
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
        <View
          style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}
        >
          <Feather name="check-circle" size={56} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Pembayaran Berhasil!
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Pesananmu sedang diproses oleh pemilik. Kamu akan dihubungi segera.
        </Text>

        {booking && (
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.successRow}>
              <Text style={[styles.successLabel, { color: colors.mutedForeground }]}>
                Item
              </Text>
              <Text style={[styles.successValue, { color: colors.foreground }]}>
                {booking.itemName}
              </Text>
            </View>
            <View style={[styles.successDivider, { backgroundColor: colors.border }]} />
            <View style={styles.successRow}>
              <Text style={[styles.successLabel, { color: colors.mutedForeground }]}>
                Total Dibayar
              </Text>
              <Text style={[styles.successAmount, { color: colors.primary }]}>
                {formatRp(booking.totalAmount)}
              </Text>
            </View>
            <View style={[styles.successDivider, { backgroundColor: colors.border }]} />
            <View style={styles.successRow}>
              <Text style={[styles.successLabel, { color: colors.mutedForeground }]}>
                Metode
              </Text>
              <Text style={[styles.successValue, { color: colors.foreground }]}>
                {METHODS.find((m) => m.id === selected)?.label}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          style={[
            styles.doneBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
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

  // Loading
  if (isLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Not found
  if (!booking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={[styles.centerText, { color: colors.foreground }]}>
          Pesanan tidak ditemukan
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 8 }}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  // Already paid
  if (booking.status !== "pending") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="info" size={40} color={colors.mutedForeground} />
        <Text style={[styles.centerText, { color: colors.foreground }]}>
          Pesanan ini sudah {booking.status === "active" ? "aktif" : "diproses"}
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 8 }}>Kembali</Text>
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
          Pembayaran
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: bottomPadding + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View
          style={[
            styles.orderCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Ringkasan Pesanan
          </Text>

          <View style={styles.orderRow}>
            <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>
              Item
            </Text>
            <Text
              style={[styles.orderValue, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {booking.itemName}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>
              Periode
            </Text>
            <Text style={[styles.orderValue, { color: colors.foreground }]}>
              {formatDate(booking.startDate)} –{"\n"}
              {formatDate(booking.endDate)}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={[styles.orderLabel, { color: colors.mutedForeground }]}>
              Durasi
            </Text>
            <Text style={[styles.orderValue, { color: colors.foreground }]}>
              {booking.durationDays} hari
            </Text>
          </View>

          <View style={[styles.orderDivider, { backgroundColor: colors.border }]} />

          {/* Cost breakdown */}
          {[
            { label: "Biaya Sewa", amount: booking.rentalFee },
            { label: "Deposit", amount: booking.depositAmount },
            ...(booking.serviceFee
              ? [{ label: "Biaya Layanan", amount: booking.serviceFee }]
              : []),
            ...(booking.insuranceFee
              ? [{ label: "Asuransi", amount: booking.insuranceFee }]
              : []),
          ].map(({ label, amount }) => (
            <View key={label} style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.mutedForeground }]}>
                {label}
              </Text>
              <Text style={[styles.costValue, { color: colors.foreground }]}>
                {formatRp(amount)}
              </Text>
            </View>
          ))}

          <View style={[styles.orderDivider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>
              Total
            </Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              {formatRp(booking.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Metode Pembayaran
        </Text>

        <View style={styles.methodsGrid}>
          {METHODS.map((method) => {
            const isSelected = selected === method.id;
            return (
              <Pressable
                key={method.id}
                style={({ pressed }) => [
                  styles.methodCard,
                  {
                    backgroundColor: isSelected
                      ? method.color + "12"
                      : colors.card,
                    borderColor: isSelected ? method.color : colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={() => {
                  setSelected(method.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {/* Selection ring */}
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected ? method.color : colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: method.color },
                      ]}
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.methodIconWrap,
                    { backgroundColor: method.color + "18" },
                  ]}
                >
                  <Feather
                    name={method.icon as "zap"}
                    size={20}
                    color={method.color}
                  />
                </View>

                <View style={styles.methodInfo}>
                  <Text
                    style={[
                      styles.methodLabel,
                      {
                        color: isSelected ? method.color : colors.foreground,
                        fontWeight: isSelected ? "700" : "600",
                      },
                    ]}
                  >
                    {method.label}
                  </Text>
                  <Text
                    style={[styles.methodDesc, { color: colors.mutedForeground }]}
                  >
                    {method.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Bank Transfer Instructions */}
        {selected === "bank_transfer" && (
          <View
            style={[
              styles.bankInfoCard,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.bankInfoHeader}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text
                style={[styles.bankInfoTitle, { color: colors.foreground }]}
              >
                Cara Pembayaran Transfer Bank
              </Text>
            </View>
            {[
              "Klik 'Bayar Sekarang' di bawah",
              "Catat nomor virtual account yang diberikan",
              "Transfer ke nomor VA sebelum batas waktu",
              "Pesanan otomatis aktif setelah transfer terkonfirmasi",
            ].map((step, i) => (
              <View key={i} style={styles.bankStep}>
                <View
                  style={[
                    styles.bankStepNum,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.bankStepNumText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={[styles.bankStepText, { color: colors.mutedForeground }]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* E-wallet instant note */}
        {selected && selected !== "bank_transfer" && (
          <View
            style={[
              styles.instantBadge,
              {
                backgroundColor: colors.success + "15",
                borderRadius: colors.radius / 2,
              },
            ]}
          >
            <Feather name="zap" size={14} color={colors.success} />
            <Text style={[styles.instantText, { color: colors.success }]}>
              Pembayaran instan — pesanan langsung diproses
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Pay Button */}
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
        <View style={styles.bottomTotal}>
          <Text style={[styles.bottomTotalLabel, { color: colors.mutedForeground }]}>
            Total Bayar
          </Text>
          <Text style={[styles.bottomTotalAmount, { color: colors.primary }]}>
            {formatRp(booking.totalAmount)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.payBtn,
            {
              backgroundColor:
                !selected || isPending
                  ? colors.mutedForeground
                  : colors.primary,
              borderRadius: colors.radius / 2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handlePay}
          disabled={!selected || isPending}
        >
          {isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.payBtnText, { color: colors.primaryForeground }]}>
              {selected ? "Bayar Sekarang" : "Pilih Metode"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  centerText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  orderLabel: {
    fontSize: 13,
    width: 72,
    flexShrink: 0,
  },
  orderValue: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  orderDivider: {
    height: 1,
    marginVertical: 2,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costLabel: {
    fontSize: 13,
  },
  costValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  methodsGrid: {
    gap: 10,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodLabel: {
    fontSize: 15,
  },
  methodDesc: {
    fontSize: 12,
  },
  bankInfoCard: {
    padding: 14,
    gap: 10,
  },
  bankInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  bankInfoTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  bankStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bankStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bankStepNumText: {
    fontSize: 11,
    fontWeight: "700",
  },
  bankStepText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  instantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  instantText: {
    fontSize: 13,
    fontWeight: "500",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  bottomTotal: {
    flex: 1,
    gap: 2,
  },
  bottomTotalLabel: {
    fontSize: 11,
  },
  bottomTotalAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  payBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 160,
    alignItems: "center",
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
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
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  successSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  successCard: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    gap: 12,
    marginVertical: 8,
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  successLabel: {
    fontSize: 13,
  },
  successValue: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  successAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  successDivider: {
    height: 1,
  },
  doneBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    marginTop: 8,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
