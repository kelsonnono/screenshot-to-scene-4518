import { z } from "zod";

/** Airports offered in v1 — Taipei / Kaohsiung out, the popular short-haul destinations in. */
export const AIRPORT_CODES = ["TPE", "KHH", "NRT", "HND", "ICN", "KIX", "BKK", "HKG"] as const;
export type AirportCode = (typeof AIRPORT_CODES)[number];

export const AIRPORT_LABELS: Record<AirportCode, string> = {
  TPE: "台北 Taipei (TPE)",
  KHH: "高雄 Kaohsiung (KHH)",
  NRT: "東京 Tokyo Narita (NRT)",
  HND: "東京 Tokyo Haneda (HND)",
  ICN: "首爾 Seoul (ICN)",
  KIX: "大阪 Osaka (KIX)",
  BKK: "曼谷 Bangkok (BKK)",
  HKG: "香港 Hong Kong (HKG)",
};

export const CURRENCY_CODES = ["TWD", "USD", "JPY", "KRW"] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  TWD: "TWD 台幣",
  USD: "USD 美元",
  JPY: "JPY 日幣",
  KRW: "KRW 韓幣",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  TWD: "NT$",
  USD: "$",
  JPY: "¥",
  KRW: "₩",
};

/**
 * The same three rules the database enforces, checked before we send anything:
 * a price must be above zero, and the two airports must be different.
 */
export const subscriptionInputSchema = z
  .object({
    origin: z.enum(AIRPORT_CODES),
    destination: z.enum(AIRPORT_CODES),
    target_price: z.coerce
      .number({ message: "請輸入數字 / Enter a number" })
      .gt(0, "目標價必須大於 0 / Target price must be above 0"),
    currency: z.enum(CURRENCY_CODES),
  })
  .refine((value) => value.origin !== value.destination, {
    message: "出發與抵達不能相同 / Origin and destination must be different",
    path: ["destination"],
  });

export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>;

export const routeSubscriptionsQueryKey = (userId: string) =>
  ["route-subscriptions", userId] as const;

export function formatTargetPrice(price: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${price.toLocaleString("en-US")}`;
}

/** Postgres unique-violation code for the one-watch-per-route constraint. */
export function isDuplicateRouteError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}
