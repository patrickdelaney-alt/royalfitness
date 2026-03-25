import { BOTTOM_NAV_HEIGHT } from "@/components/bottom-nav.constants";

export const safeAreaBottom = "env(safe-area-inset-bottom)";
export const tabBarHeight = BOTTOM_NAV_HEIGHT;

export const contentBottomPadding = `calc(${tabBarHeight} + 1rem)`;
export const sheetBottomPadding = `calc(1rem + ${safeAreaBottom})`;
export const fixedCtaBottomOffset = `calc(${tabBarHeight} + 1rem)`;
