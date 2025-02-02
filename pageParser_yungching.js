export async function extractData(page) {
  return await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll(".buy-list .buy-item"));
    return items.map((item) => ({
      image: item.querySelector(".img-wrapper img")?.src?.startsWith("https")
        ? item.querySelector(".img-wrapper img")?.src
        : null,
      link: item.querySelector(".link")?.href,
      title: item.querySelector(".caseName")?.innerText,
      location: item.querySelector(".address-wrapper .address")?.innerText,
      description: item.querySelector(".note")?.innerText,
      details: Array.from(item.querySelectorAll(".case-info span")).map(
        (span) => span.innerText
      ),
      tags: Array.from(item.querySelectorAll(".tag-list .tag-item")).map(
        (tag) => tag.innerText
      ),
      price: item.querySelector(".price-wrapper .price")?.innerText,
    }));
  });
}
