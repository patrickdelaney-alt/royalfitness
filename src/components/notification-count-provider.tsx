"use client";

import { createContext, useContext, useState } from "react";

interface NotificationCountContextValue {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationCountContext = createContext<NotificationCountContextValue | null>(null);

export function NotificationCountProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  return (
    <NotificationCountContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationCountContext.Provider>
  );
}

export function useNotificationCount(): NotificationCountContextValue {
  const ctx = useContext(NotificationCountContext);
  if (!ctx) throw new Error("useNotificationCount must be used within NotificationCountProvider");
  return ctx;
}
