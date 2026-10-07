// ponytail: listing data is server-rendered in __NEXT_DATA__, no browser needed
export async function fetchList(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`sinyi ${res.status} ${url}`);
  const html = await res.text();
  const json = html.match(
    /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s
  )?.[1];
  if (!json) throw new Error(`sinyi __NEXT_DATA__ not found ${url}`);
  const list = JSON.parse(json).props.initialReduxState.buyReducer.list;

  return list.map((item) => ({
    image: item.image?.[0] ?? null,
    // keep the old link format so DB dedupe still matches existing rows
    link: `https://www.sinyi.com.tw/buy/house/${item.houseNo}?breadcrumb=list`,
    title: item.name,
    price: item.totalPrice.toLocaleString("en-US"),
    location: item.address,
    description: item.age,
    details: [
      `建坪 ${item.areaBuilding}`,
      `主 + 陽${item.pingUsed}`,
      item.layout,
      `${item.floor}樓/${item.totalfloor}樓`,
    ],
    tags: [], // ponytail: tags are numeric ids, never displayed
  }));
}
