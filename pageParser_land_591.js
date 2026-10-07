import { fetchHtml, text, one, all } from "./html.js";

// ponytail: listing cards are server-rendered (Nuxt SSR), no browser needed
export async function fetchList(url) {
  const html = await fetchHtml(url);
  const list = html.slice(html.indexOf('class="list-wrapper'));
  const items = list.split(/<div[^>]*class="item"/).slice(1);

  return items.map((item) => {
    const images = [...item.matchAll(/<img\b[^>]*data-src="([^"]*)"/g)].map((m) => m[1]);
    const a = item.match(/class="link[^"]*" href="([^"]*)"[^>]*>(.*?)<\/a>/s);
    // first item-info-txt: area / land type / zoning / road width; second: address
    const [info = "", address = ""] = all(item, "item-info-txt", "div");
    return {
      image: images[0] ?? null,
      link: a?.[1] ?? "",
      title: text(a?.[2]),
      // non-greedy match stops at the inner </div>, which is right after the total price
      price: text(one(item, "item-info-price", "div")).replace(/萬/g, ""),
      location: text(address),
      description: "",
      details: [...info.matchAll(/<span[^>]*>(.*?)<\/span>/gs)].map((m) => text(m[1])),
      tags: all(item, "tag", "span").map(text),
    };
  });
}
