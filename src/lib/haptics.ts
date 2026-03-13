import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const safe = (fn: () => Promise<void>) => fn().catch(() => {});

export const lightImpact = () =>
  safe(() => Haptics.impact({ style: ImpactStyle.Light }));

export const mediumImpact = () =>
  safe(() => Haptics.impact({ style: ImpactStyle.Medium }));

export const successNotification = () =>
  safe(() => Haptics.notification({ type: NotificationType.Success }));
