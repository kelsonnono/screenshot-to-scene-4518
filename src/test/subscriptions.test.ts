import { describe, expect, it } from "vitest";

import { formatTargetPrice, subscriptionInputSchema } from "@/lib/subscriptions";

const valid = {
  origin: "TPE",
  destination: "NRT",
  target_price: 9500,
  currency: "TWD",
};

describe("route subscription rules", () => {
  it("accepts a real route with a positive target price", () => {
    const result = subscriptionInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a target price of 0 TWD", () => {
    const result = subscriptionInputSchema.safeParse({ ...valid, target_price: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative target price", () => {
    const result = subscriptionInputSchema.safeParse({ ...valid, target_price: -500 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric target price", () => {
    const result = subscriptionInputSchema.safeParse({ ...valid, target_price: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects the same airport for origin and destination", () => {
    const result = subscriptionInputSchema.safeParse({ ...valid, destination: "TPE" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["destination"]);
    }
  });

  it("rejects an airport code we do not offer", () => {
    const result = subscriptionInputSchema.safeParse({ ...valid, destination: "LAX" });
    expect(result.success).toBe(false);
  });

  it("rejects a currency we do not support", () => {
    const result = subscriptionInputSchema.safeParse({ ...valid, currency: "EUR" });
    expect(result.success).toBe(false);
  });

  it("formats a TWD target price with the local symbol", () => {
    expect(formatTargetPrice(9500, "TWD")).toBe("NT$9,500");
  });

  it("formats a JPY target price with the yen symbol", () => {
    expect(formatTargetPrice(18000, "JPY")).toBe("¥18,000");
  });
});
