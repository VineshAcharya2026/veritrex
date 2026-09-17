// @ts-nocheck
// Generated OpenNext worker is imported only after `opennextjs-cloudflare build`.
import { default as handler } from "./.open-next/worker.js";

/**
 * Custom Cloudflare Worker entry: OpenNext fetch + daily cron integrity jobs.
 * @see https://opennext.js.org/cloudflare/howtos/custom-worker
 */
export default {
  fetch: handler.fetch,

  async scheduled(_controller, env, ctx) {
    const secret = typeof env.CRON_SECRET === "string" ? env.CRON_SECRET.trim() : "";
    if (!secret) {
      console.error("[cron] CRON_SECRET is not set — skipping scheduled integrity jobs");
      return;
    }

    const self = env.WORKER_SELF_REFERENCE;
    if (!self) {
      console.error("[cron] WORKER_SELF_REFERENCE binding missing");
      return;
    }

    ctx.waitUntil(
      self
        .fetch(
          new Request("https://tursthire.internal/api/cron", {
            method: "GET",
            headers: { Authorization: `Bearer ${secret}` },
          })
        )
        .then(async (res) => {
          if (!res.ok) {
            console.error("[cron] integrity jobs failed", res.status, await res.text());
          }
        })
        .catch((err) => {
          console.error("[cron] integrity jobs error", err);
        })
    );
  },
};
