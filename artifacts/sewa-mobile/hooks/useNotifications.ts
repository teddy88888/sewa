import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getNotificationPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined"
> {
  if (Platform.OS === "web") return "denied";
  const { status } = await Notifications.getPermissionsAsync();
  return status as "granted" | "denied" | "undetermined";
}

export async function schedulePaymentSuccessNotification(params: {
  itemName: string;
  totalAmount: number;
  startDate: string;
}): Promise<void> {
  if (Platform.OS === "web") return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const formattedAmount = `Rp${params.totalAmount.toLocaleString("id-ID")}`;
  const formattedDate = new Date(params.startDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pembayaran Berhasil! 🎉",
      body: `${params.itemName} siap disewa mulai ${formattedDate}. Total: ${formattedAmount}`,
      data: { type: "payment_success" },
    },
    trigger: null,
  });
}

export async function scheduleNewBookingNotification(params: {
  renterName: string;
  itemName: string;
  durationDays: number;
}): Promise<void> {
  if (Platform.OS === "web") return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pesanan Baru Masuk! 📦",
      body: `${params.renterName} ingin menyewa "${params.itemName}" selama ${params.durationDays} hari. Segera konfirmasi!`,
      data: { type: "new_booking" },
    },
    trigger: null,
  });
}

export async function scheduleReturnReminderNotification(params: {
  itemName: string;
  endDate: string;
}): Promise<void> {
  if (Platform.OS === "web") return;
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const end = new Date(params.endDate);
  const reminderDate = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const now = new Date();

  if (reminderDate <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pengingat Pengembalian ⏰",
      body: `"${params.itemName}" harus dikembalikan besok. Pastikan siap dikembalikan!`,
      data: { type: "return_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}
