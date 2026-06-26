import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

export type NotifType =
  | "payment_success"
  | "new_booking"
  | "return_reminder"
  | "general";

export interface InboxItem {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

interface NotificationContextValue {
  notifications: InboxItem[];
  unreadCount: number;
  addNotification: (item: Omit<InboxItem, "id" | "timestamp" | "read">) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const STORAGE_KEY = "@sewa_notifications_v1";

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  addNotification: async () => {},
  markAsRead: async () => {},
  markAllRead: async () => {},
  clearAll: async () => {},
});

async function load(): Promise<InboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InboxItem[]) : [];
  } catch {
    return [];
  }
}

async function save(items: InboxItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<InboxItem[]>([]);
  const listenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    load().then(setNotifications);
  }, []);

  // Listen for notifications received while app is foregrounded
  useEffect(() => {
    if (Platform.OS === "web") return;
    listenerRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        if (!title) return;
        const item: InboxItem = {
          id: notification.request.identifier,
          type: (data?.type as NotifType) ?? "general",
          title: title ?? "",
          body: body ?? "",
          timestamp: Date.now(),
          read: false,
        };
        setNotifications((prev) => {
          const next = [item, ...prev].slice(0, 50);
          save(next);
          return next;
        });
      }
    );
    return () => {
      listenerRef.current?.remove();
    };
  }, []);

  const addNotification = useCallback(
    async (partial: Omit<InboxItem, "id" | "timestamp" | "read">) => {
      const item: InboxItem = {
        ...partial,
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => {
        const next = [item, ...prev].slice(0, 50);
        save(next);
        return next;
      });
    },
    []
  );

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      save(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    save([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationInbox() {
  return useContext(NotificationContext);
}
