import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parsePaymentPayload, validateTelegramInitData } from "./telegram.js";

describe("telegram helpers", () => {
  it("validates signed initData", () => {
    const botToken = "123456:test";
    const user = JSON.stringify({ id: 42, username: "amir" });
    const authDate = Math.floor(Date.now() / 1000);
    const dataCheckString = [`auth_date=${authDate}`, `query_id=abc`, `user=${user}`].join("\n");
    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    const initData = new URLSearchParams({
      query_id: "abc",
      user,
      auth_date: String(authDate),
      hash
    }).toString();

    expect(validateTelegramInitData(initData, botToken).user.id).toBe(42);
  });

  it("rejects invalid payment payloads", () => {
    expect(() => parsePaymentPayload("{}")).toThrow("Payment payload is invalid.");
  });
});
