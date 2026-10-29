export const APP_STORE_URL = "https://apps.apple.com/app/apple-store/id6761489019?pt=127914093&ct=meta_us_video01&mt=8";
export const META_PIXEL_ID = "REPLACE_ME";
export const OUTBOX_OFFER = { trialDays: 7, annualPrice: 14.99, minimumIOS: 17 };
export const canLoadOutboxPixel = (id: string, pathname: string) => /^\d+$/.test(id) && pathname.replace(/\/$/, "") === "/outbox";

type Pixel = ((...args: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...args: unknown[]) => void; loaded?: boolean; version?: string; push?: Pixel };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel } }

export function startOutboxPixel() {
  if (!canLoadOutboxPixel(META_PIXEL_ID, window.location.pathname)) return;
  if (!window.fbq) {
    const pixel: Pixel = (...args) => { if (pixel.callMethod) pixel.callMethod(...args); else pixel.queue?.push(args); };
    pixel.queue = []; pixel.loaded = true; pixel.version = "2.0"; pixel.push = pixel;
    window.fbq = pixel; window._fbq = pixel;
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/fbevents.js"; script.async = true;
    document.head.appendChild(script);
  }
  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
}

export function trackOutboxDownload() {
  if (!canLoadOutboxPixel(META_PIXEL_ID, window.location.pathname)) return;
  window.fbq?.("track", "Lead");
  window.fbq?.("trackCustom", "AppStoreClick");
}