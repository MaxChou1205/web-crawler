// ponytail: call the JSON API the page itself uses, no browser needed
// arg is the listing path after /area/, e.g. "臺北市-city/文山區-town/.../page1.html"
export async function fetchList(arg, page) {
  const res = await fetch("https://buy.cthouse.com.tw/api/house_list.ashx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ arg, page: String(page) }),
  });
  if (!res.ok) throw new Error(`ct ${res.status} ${arg}`);
  const data = await res.json();
  if (data.RS !== "OK") throw new Error(`ct RS=${data.RS} ${arg}`);

  return data.houses.map((h) => ({
    image: h.hp_photo1s || null,
    // buy_domain ends with "/" and url starts with "/": the old scraper stored
    // this exact double-slash form, so keep it for DB dedupe
    link: data.buy_domain + h.url,
    title: h.case_name,
    price: h.sell_price,
    location: h.address,
    description: "",
    details: [
      `${h.size_txt} ${h.size_val}坪`,
      `${h.area_txt} ${h.area_val}坪`,
      `${h.land_txt} ${h.land_val}坪`,
      `${h.age_txt} ${h.age_val}`,
      `${h.type_txt} ${h.type_val}`,
      `${h.floor_txt} ${h.floor_val}`,
    ],
    tags: [],
  }));
}
