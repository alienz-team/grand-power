// OpenNext → Cloudflare Workers adapter config.
// All storefront/admin pages are dynamic (they read the gp_lang / gp_theme cookies), so a read-only
// static-assets incremental cache is enough for the few build-time prerendered routes (robots, sitemap, 404).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
