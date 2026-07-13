/**
 * Build-time social-preview (Open Graph / Twitter) meta injection.
 *
 * Why this exists: link-preview crawlers (WhatsApp, Facebook, Twitter, iMessage,
 * Slack…) do NOT execute JavaScript. They only read the static HTML we ship.
 * The SPA updates document.title / favicon at runtime from the tenant config,
 * but crawlers never see that. Each tenant is its own Netlify build with its own
 * VITE_TENANT_ID, so here — after `vite build` — we fetch that tenant's branding
 * from the public tenant API and rewrite the managed <!-- social-meta --> block
 * in dist/index.html. The result: every tenant's links preview with their own
 * name, tagline and logo, with zero hardcoding.
 *
 * This never fails the build: if the tenant id / API is missing or unreachable,
 * we leave the built-in default tags in place and just log a warning.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '..', 'dist', 'index.html');

const START = '<!-- social-meta:start -->';
const END = '<!-- social-meta:end -->';

const TENANT_ID = process.env.VITE_TENANT_ID;
// VITE_API_URL is the same value the app uses (e.g. https://api.example.com/api/v1).
const API_BASE = (process.env.VITE_API_URL || '').replace(/\/+$/, '');
// Optional canonical site URL for og:url (e.g. https://tenant.dailytaiyari.in).
const SITE_URL = (process.env.VITE_SITE_URL || process.env.URL || '').replace(/\/+$/, '');

const escapeHtml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function buildMetaBlock({ title, description, image, url, siteName }) {
  const tag = (line) => `    ${line}`;
  const lines = [
    START,
    tag(`<title>${escapeHtml(title)}</title>`),
    tag(`<meta name="description" content="${escapeHtml(description)}" />`),
    tag(`<meta property="og:type" content="website" />`),
    tag(`<meta property="og:site_name" content="${escapeHtml(siteName)}" />`),
    tag(`<meta property="og:title" content="${escapeHtml(title)}" />`),
    tag(`<meta property="og:description" content="${escapeHtml(description)}" />`),
    url ? tag(`<meta property="og:url" content="${escapeHtml(url)}" />`) : null,
    image ? tag(`<meta property="og:image" content="${escapeHtml(image)}" />`) : null,
    tag(`<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`),
    tag(`<meta name="twitter:title" content="${escapeHtml(title)}" />`),
    tag(`<meta name="twitter:description" content="${escapeHtml(description)}" />`),
    image ? tag(`<meta name="twitter:image" content="${escapeHtml(image)}" />`) : null,
    `    ${END}`,
  ].filter(Boolean);
  return lines.join('\n');
}

async function main() {
  if (!TENANT_ID || !API_BASE) {
    console.warn(
      '[inject-meta] VITE_TENANT_ID or VITE_API_URL not set — keeping default social meta tags.'
    );
    return;
  }

  let tenant;
  try {
    const res = await fetch(`${API_BASE}/tenant/${TENANT_ID}/`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    tenant = await res.json();
  } catch (err) {
    console.warn(
      `[inject-meta] Could not fetch tenant ${TENANT_ID} (${err.message}) — keeping default social meta tags.`
    );
    return;
  }

  const name = tenant.name || 'DailyTaiyari';
  const tagline = tenant.tagline || '';
  const title = tagline ? `${name} - ${tagline}` : name;
  const description =
    tagline || `${name} — learn, practice and prepare with DailyTaiyari.`;
  const image = tenant.logo || tenant.favicon || null;

  let html;
  try {
    html = await readFile(htmlPath, 'utf8');
  } catch (err) {
    console.warn(`[inject-meta] Could not read ${htmlPath} (${err.message}) — skipping.`);
    return;
  }

  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    console.warn('[inject-meta] social-meta markers not found in index.html — skipping.');
    return;
  }

  const block = buildMetaBlock({
    title,
    description,
    image,
    url: SITE_URL || null,
    siteName: name,
  });

  const before = html.slice(0, startIdx);
  const after = html.slice(endIdx + END.length);
  await writeFile(htmlPath, before + block + after, 'utf8');

  console.log(`[inject-meta] Injected social meta for tenant "${name}"${image ? ' (with image)' : ''}.`);
}

main().catch((err) => {
  // Never fail the build over previews.
  console.warn(`[inject-meta] Unexpected error: ${err.message} — keeping default tags.`);
});
