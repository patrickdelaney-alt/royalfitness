import { BOTTOM_NAV_HEIGHT } from "@/components/bottom-nav.constants";

export const safeAreaBottom = "env(safe-area-inset-bottom)";
export const keyboardInsetBottom = "env(keyboard-inset-height, 0px)";
export const tabBarHeight = BOTTOM_NAV_HEIGHT;
export const interactiveBottomInset = `max(${safeAreaBottom}, ${keyboardInsetBottom})`;

export const contentBottomPadding = `calc(${tabBarHeight} + 1rem)`;
export const sheetBottomPadding = `calc(1rem + ${safeAreaBottom})`;
export const fixedCtaBottomOffset = `calc(${tabBarHeight} + 1rem + ${keyboardInsetBottom})`;
