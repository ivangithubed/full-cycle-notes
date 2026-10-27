// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Public address of the deployed site. Needed for absolute links in Open Graph tags
  // (Telegram and other messengers only load preview images by absolute URL).
  // The GitHub Pages workflow sets SITE_URL and BASE_PATH automatically;
  // the fallbacks below are only for local development.
  site: process.env.SITE_URL || 'https://example.github.io',
  base: process.env.BASE_PATH || '/',
});
