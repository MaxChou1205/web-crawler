// ponytail: regex over server-rendered HTML instead of a DOM lib or browser;
// fine for these flat, known card layouts — switch to cheerio if a site nests deeper
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// strip tags, decode common entities, collapse whitespace
export const text = (s = "") =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

// inner HTML of every element whose class list starts with `cls`
export const all = (html, cls, tag = "\\w+") =>
  [
    ...html.matchAll(
      new RegExp(`<(${tag})\\b[^>]*class="${cls}(?:\\s[^"]*)?"[^>]*>(.*?)</\\1>`, "gs")
    ),
  ].map((m) => m[2]);

export const one = (html, cls, tag) => all(html, cls, tag)[0];
