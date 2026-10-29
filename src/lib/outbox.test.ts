import { describe, expect, it } from "bun:test";
import { APP_STORE_URL, OUTBOX_OFFER, canLoadOutboxPixel } from "./outbox";

describe("Outbox requirements", () => {
  it("uses the exact campaign download URL", () => expect(APP_STORE_URL).toBe("https://apps.apple.com/app/apple-store/id6761489019?pt=127914093&ct=meta_us_video01&mt=8"));
  it("offers a seven-day trial", () => expect(OUTBOX_OFFER.trialDays).toBe(7));
  it("charges $14.99 annually", () => expect(OUTBOX_OFFER.annualPrice).toBe(14.99));
  it("requires iOS 17 or newer", () => expect(OUTBOX_OFFER.minimumIOS).toBe(17));
  it("never loads an unconfigured pixel", () => expect(canLoadOutboxPixel("REPLACE_ME", "/outbox")).toBe(false));
  it("only allows pixel loading on Outbox", () => { expect(canLoadOutboxPixel("123456789", "/ventures")).toBe(false); expect(canLoadOutboxPixel("123456789", "/outbox")).toBe(true); });
});