import { fetchHtml, text, one, all } from "./html.js";

// ponytail: listing cards are server-rendered (Angular SSR), no browser needed;
// the ng-state API payload is obfuscated, so parse the HTML instead
export async function fetchList(url) {
  const html = await fetchHtml(url);
  const cards = html.split('class="search-result-list-item"').slice(1);

  return cards.map((card) => {
    const src = card.match(/<img\b[^>]*\ssrc="([^"]*)"/)?.[1]?.replace(/&amp;/g, "&");
    const caseInfo = one(card, "case-info", "div") ?? "";
    return {
      image: src?.startsWith("https://") ? src : null,
      link: `https://buy.yungching.com.tw/${card.match(/class="link" href="\/?([^"]*)"/)[1]}`,
      title: text(one(card, "caseName", "div")),
      location: text(one(card, "address", "span")),
      description: text(one(card, "note", "div")),
      details: [...caseInfo.matchAll(/<span[^>]*>(.*?)<\/span>/gs)].map((m) => text(m[1])),
      tags: all(card, "tag-item", "li").map(text),
      price: text(one(card, "price", "div")),
    };
  });
}
