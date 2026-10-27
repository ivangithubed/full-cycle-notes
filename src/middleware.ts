import { defineMiddleware } from "astro:middleware";

// Post-processes every HTML page: adds the base path to internal links
// and highlights words about AI.

// Words about AI that get the red accent: ШІ, AI, штучний інтелект, агенти, скіли, промпти.
// Endings are listed explicitly so that look-alike words (e.g. «скільки», «агентство») stay plain.
const NOUN_ENDINGS = "(?:а|у|ом|і|и|ів|ам|ами|ах)?";
const AI_TERMS = new RegExp(
  "(?<![\\p{L}\\p{N}])(" +
    [
      "ШІ",
      "AI",
      "штучн(?:ий|ого|ому|им|ім)\\s+інтелект" + NOUN_ENDINGS,
      "(?:суб|мульти)?агент(?:а|у|ом|і|и|ів|ам|ами|ах|н(?:ий|а|е|і|ого|ої|ому|ій|им|их|ими|у))?",
      "скіл" + NOUN_ENDINGS,
      "промпт" + NOUN_ENDINGS,
    ].join("|") +
    ")(?![\\p{L}\\p{N}])",
  "giu",
);

// Text inside these elements is left untouched
const SKIP_TAGS = new Set(["head", "title", "script", "style", "code", "pre", "textarea", "svg"]);

// Base path of the site ("" at the domain root, "/repo" on GitHub Pages project sites).
// Pages and Markdown use root-relative links like "/posts/...", so they are prefixed here.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function withBase(tag: string): string {
  if (!BASE) return tag;
  return tag.replace(/(\s(?:href|src)=")(\/(?!\/)[^"]*)"/g, (whole, attr, path) =>
    path === BASE || path.startsWith(`${BASE}/`) ? whole : `${attr}${BASE}${path}"`,
  );
}

function transformHtml(html: string): string {
  const parts = html.split(/(<[^>]+>)/);
  const skipStack: string[] = [];

  return parts
    .map((part) => {
      if (part.startsWith("<")) {
        const match = part.match(/^<\s*(\/)?\s*([a-zA-Z0-9-]+)/);
        if (match) {
          const [, closing, rawName] = match;
          const name = rawName.toLowerCase();
          if (SKIP_TAGS.has(name)) {
            if (closing) skipStack.pop();
            else if (!part.endsWith("/>")) skipStack.push(name);
          }
        }
        return withBase(part);
      }
      if (skipStack.length > 0) return part;
      return part.replace(AI_TERMS, '<span class="ai-term">$1</span>');
    })
    .join("");
}

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const html = await response.text();
  return new Response(transformHtml(html), {
    status: response.status,
    headers: response.headers,
  });
});
