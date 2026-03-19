/**
 * Pure utility functions for parsing raw affiliate/referral input text.
 * No external dependencies — regex and string matching only.
 */

export type AffiliateCategory =
  | "SUPPLEMENTS"
  | "WELLNESS_ACCESSORIES"
  | "GYM_ACCESSORIES"
  | "RECOVERY_TOOLS"
  | "APPAREL"
  | "NUTRITION"
  | "TECH_WEARABLES"
  | "OTHER";

interface ParsedAffiliateInput {
  urls: string[];
  codes: string[];
  brand: string | null;
}

const URL_REGEX = /https?:\/\/[^\s<>"'`,)}\]]+/gi;

// Discount/promo code patterns: short uppercase alphanumeric, often with numbers
// e.g. ROYAL20, SAVE15OFF, GET10, FITFAM25
const CODE_REGEX = /\b[A-Z][A-Z0-9]{2,15}\b/g;

// Common words that look like codes but aren't
const CODE_EXCLUSIONS = new Set([
  "THE", "AND", "FOR", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE",
  "OUR", "OUT", "GET", "HAS", "HIM", "HIS", "HOW", "ITS", "MAY", "NEW",
  "NOW", "OLD", "SEE", "WAY", "WHO", "DID", "USE", "SAY", "SHE", "TWO",
  "ANY", "FEW", "GOT", "LET", "PUT", "TOO", "URL", "HTTP", "HTTPS", "WWW",
  "COM", "ORG", "NET",
]);

// Brand/domain keyword → category mappings
const BRAND_CATEGORY_MAP: Record<string, AffiliateCategory> = {
  // Supplements
  myprotein: "SUPPLEMENTS",
  optimumnutrition: "SUPPLEMENTS",
  ghostlifestyle: "SUPPLEMENTS",
  transparentlabs: "SUPPLEMENTS",
  gorillaming: "SUPPLEMENTS",
  rawnutrition: "SUPPLEMENTS",
  legionathlet: "SUPPLEMENTS",
  nutrabio: "SUPPLEMENTS",
  thorne: "SUPPLEMENTS",
  momentous: "SUPPLEMENTS",
  athletic_greens: "SUPPLEMENTS",
  athleticgreens: "SUPPLEMENTS",
  drinkag1: "SUPPLEMENTS",
  // Apparel
  lululemon: "APPAREL",
  gymshark: "APPAREL",
  nike: "APPAREL",
  adidas: "APPAREL",
  underarmour: "APPAREL",
  alphalete: "APPAREL",
  youngla: "APPAREL",
  buffbunny: "APPAREL",
  nvgtn: "APPAREL",
  // Tech / Wearables
  whoop: "TECH_WEARABLES",
  garmin: "TECH_WEARABLES",
  fitbit: "TECH_WEARABLES",
  oura: "TECH_WEARABLES",
  apple: "TECH_WEARABLES",
  // Recovery
  theragun: "RECOVERY_TOOLS",
  hyperice: "RECOVERY_TOOLS",
  normatec: "RECOVERY_TOOLS",
  rollrecovery: "RECOVERY_TOOLS",
  compex: "RECOVERY_TOOLS",
  // Gym accessories
  rogue: "GYM_ACCESSORIES",
  roguefitness: "GYM_ACCESSORIES",
  repfitness: "GYM_ACCESSORIES",
  titan: "GYM_ACCESSORIES",
  gymreapers: "GYM_ACCESSORIES",
  bear_grips: "GYM_ACCESSORIES",
  ironmind: "GYM_ACCESSORIES",
  // Nutrition / food
  barebell: "NUTRITION",
  rxbar: "NUTRITION",
  builtbar: "NUTRITION",
  quest: "NUTRITION",
  // Wellness accessories
  manduka: "WELLNESS_ACCESSORIES",
  liftoff: "WELLNESS_ACCESSORIES",
  triggerpoint: "WELLNESS_ACCESSORIES",
};

const KEYWORD_CATEGORY_MAP: Record<string, AffiliateCategory> = {
  supplement: "SUPPLEMENTS",
  protein: "SUPPLEMENTS",
  creatine: "SUPPLEMENTS",
  preworkout: "SUPPLEMENTS",
  vitamin: "SUPPLEMENTS",
  bcaa: "SUPPLEMENTS",
  collagen: "SUPPLEMENTS",
  greens: "SUPPLEMENTS",
  apparel: "APPAREL",
  clothing: "APPAREL",
  leggings: "APPAREL",
  shorts: "APPAREL",
  joggers: "APPAREL",
  shirt: "APPAREL",
  hoodie: "APPAREL",
  watch: "TECH_WEARABLES",
  tracker: "TECH_WEARABLES",
  wearable: "TECH_WEARABLES",
  band: "TECH_WEARABLES",
  recovery: "RECOVERY_TOOLS",
  massage: "RECOVERY_TOOLS",
  foam_roller: "RECOVERY_TOOLS",
  roller: "RECOVERY_TOOLS",
  compression: "RECOVERY_TOOLS",
  barbell: "GYM_ACCESSORIES",
  dumbbell: "GYM_ACCESSORIES",
  belt: "GYM_ACCESSORIES",
  straps: "GYM_ACCESSORIES",
  wraps: "GYM_ACCESSORIES",
  gym_bag: "GYM_ACCESSORIES",
  mat: "WELLNESS_ACCESSORIES",
  yoga: "WELLNESS_ACCESSORIES",
  block: "WELLNESS_ACCESSORIES",
  bar: "NUTRITION",
  snack: "NUTRITION",
  meal_prep: "NUTRITION",
};

function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return null;
  }
}

function brandFromDomain(domain: string): string {
  // Remove TLD and common subdomains
  const parts = domain.split(".");
  const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  // Title-case the brand name
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Parse raw text input to extract URLs, discount codes, and brand name.
 */
export function parseAffiliateInput(rawText: string): ParsedAffiliateInput {
  const text = rawText.trim();
  if (!text) return { urls: [], codes: [], brand: null };

  // Extract URLs
  const urls = [...new Set(text.match(URL_REGEX) || [])];

  // Extract potential codes (uppercase alphanumeric tokens)
  const textWithoutUrls = text.replace(URL_REGEX, " ");
  const rawCodes = textWithoutUrls.match(CODE_REGEX) || [];
  const codes = rawCodes.filter((code) => {
    if (CODE_EXCLUSIONS.has(code)) return false;
    // Must contain at least one digit to look like a promo code, OR be 4+ chars
    return /\d/.test(code) || code.length >= 4;
  });
  const uniqueCodes = [...new Set(codes)];

  // Try to extract brand from first URL domain
  let brand: string | null = null;
  if (urls.length > 0) {
    const domain = extractDomain(urls[0]);
    if (domain) {
      brand = brandFromDomain(domain);
    }
  }

  return { urls, codes: uniqueCodes, brand };
}

/**
 * A single detected affiliate item from bulk text parsing.
 */
export interface DetectedAffiliateItem {
  name: string;
  brand: string | null;
  link: string | null;
  referralCode: string | null;
  category: AffiliateCategory;
}

/**
 * Parse bulk pasted text and return multiple affiliate items.
 * Splits on newlines — each line with a URL or code becomes an item.
 * Lines without URLs or codes are skipped.
 */
export function parseBulkAffiliateInput(rawText: string): DetectedAffiliateItem[] {
  const text = rawText.trim();
  if (!text) return [];

  // Split on newlines; each non-empty line is a potential item
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const items: DetectedAffiliateItem[] = [];

  for (const line of lines) {
    const urls = line.match(URL_REGEX) || [];
    const textWithoutUrls = line.replace(URL_REGEX, " ");
    const rawCodes = textWithoutUrls.match(CODE_REGEX) || [];
    const codes = rawCodes.filter((code) => {
      if (CODE_EXCLUSIONS.has(code)) return false;
      return /\d/.test(code) || code.length >= 4;
    });

    const url = urls[0] || null;
    const code = codes[0] || null;

    // Skip lines with no URL and no code
    if (!url && !code) continue;

    let brand: string | null = null;
    if (url) {
      const domain = extractDomain(url);
      if (domain) brand = brandFromDomain(domain);
    }

    const category = suggestCategory(line, url || undefined);

    // Generate a name from brand + category, or from URL domain, or from code
    let name = "";
    if (brand && brand.toLowerCase() !== "com") {
      name = brand;
      const catLabel = CATEGORY_LABEL_MAP[category];
      if (catLabel && category !== "OTHER") name += ` ${catLabel}`;
    } else if (url) {
      const domain = extractDomain(url);
      name = domain ? domain.split(".").slice(-2, -1)[0] || "Affiliate Link" : "Affiliate Link";
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } else if (code) {
      name = `Code: ${code}`;
    }

    items.push({ name, brand, link: url, referralCode: code, category });
  }

  return items;
}

const CATEGORY_LABEL_MAP: Record<AffiliateCategory, string> = {
  SUPPLEMENTS: "Supplements",
  WELLNESS_ACCESSORIES: "Wellness",
  GYM_ACCESSORIES: "Gym Gear",
  RECOVERY_TOOLS: "Recovery",
  APPAREL: "Apparel",
  NUTRITION: "Nutrition",
  TECH_WEARABLES: "Tech",
  OTHER: "",
};

/**
 * Suggest an affiliate category based on text content and/or URL.
 */
export function suggestCategory(text: string, url?: string): AffiliateCategory {
  const lowerText = text.toLowerCase().replace(/[\s_-]+/g, "");

  // Check URL domain first (most reliable signal)
  if (url) {
    const domain = extractDomain(url);
    if (domain) {
      const domainLower = domain.toLowerCase().replace(/[\s._-]+/g, "");
      for (const [key, category] of Object.entries(BRAND_CATEGORY_MAP)) {
        if (domainLower.includes(key.replace(/_/g, ""))) {
          return category;
        }
      }
    }
  }

  // Check brand/keyword maps against all text
  for (const [key, category] of Object.entries(BRAND_CATEGORY_MAP)) {
    if (lowerText.includes(key.replace(/_/g, ""))) {
      return category;
    }
  }

  // Check keyword map
  const words = text.toLowerCase().split(/[\s,._-]+/);
  for (const word of words) {
    if (KEYWORD_CATEGORY_MAP[word]) {
      return KEYWORD_CATEGORY_MAP[word];
    }
  }

  return "OTHER";
}
