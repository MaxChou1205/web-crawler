import { fetchHtml } from "./html.js";

// Nuxt 3 serializes page state with devalue: a flat array where objects/arrays
// hold indices into that array. Only the wrapper types Nuxt emits are unwrapped.
const WRAPPERS = ["Reactive", "ShallowReactive", "Ref", "ShallowRef", "EmptyRef", "EmptyShallowRef"];
function revive(raw) {
  const seen = new Map();
  const get = (i) => {
    if (typeof i !== "number" || i < 0) return undefined; // devalue uses negatives for undefined/NaN
    if (seen.has(i)) return seen.get(i);
    const v = raw[i];
    if (Array.isArray(v)) {
      if (WRAPPERS.includes(v[0])) return get(v[1]);
      if (typeof v[0] === "string" && v.length === 2) return v[1]; // Date, etc.
      const arr = [];
      seen.set(i, arr);
      v.forEach((x) => arr.push(get(x)));
      return arr;
    }
    if (v && typeof v === "object") {
      const obj = {};
      seen.set(i, obj);
      for (const k in v) obj[k] = get(v[k]);
      return obj;
    }
    return v;
  };
  return get(0);
}

// ponytail: listing data is server-rendered in __NUXT_DATA__, no browser needed
export async function fetchList(url) {
  const html = await fetchHtml(url);
  const json = html.match(
    /<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)<\/script>/s
  )?.[1];
  if (!json) throw new Error(`hb __NUXT_DATA__ not found ${url}`);
  // the data key is a per-request hash, so find the entry holding the list
  const list = Object.values(revive(JSON.parse(json)).data).find(
    (d) => d?.buyHouseListDatas
  )?.buyHouseListDatas;
  if (!list) throw new Error(`hb buyHouseListDatas not found ${url}`);

  return list.map((h) => ({
    image: h.photo1 || null,
    link: `https://www.hbhousing.com.tw/detail?sn=${h.sn}`,
    title: h.objName,
    price: h.price.toLocaleString("en-US"),
    location: h.doorplate,
    description: h.emphasis1 ?? "",
    details: [
      h.style,
      `${h.age}年`,
      `建坪 ${h.area}`,
      `主建物 ${h.mainArea}`,
      `${h.floor}/${h.floorTotal}樓`,
      h.special,
    ],
    tags: [],
  }));
}
