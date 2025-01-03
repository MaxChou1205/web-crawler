export async function extractData(page, baseUrl) {
  return await page.evaluate((baseUrl) => {
    const items = Array.from(
      document.querySelectorAll(".buy-list .buy-item")
    );
    return items.map((item) => ({
      image: document.querySelector(".img-wrapper img")?.src,
      link: document.querySelector(".link")?.href,
      title: document.querySelector(".caseName")?.innerText,
      location: document.querySelector(".address-wrapper .address")?.innerText,
      description: document.querySelector(".note")?.innerText,
      details: Array.from(document.querySelectorAll(".case-info span"))
        .map((span) => span.innerText)
        .join(", "),
      tags: Array.from(document.querySelectorAll(".tag-list .tag-item")).map(
        (tag) => tag.innerText
      ),
      price: document.querySelector(".price-wrapper .price")?.innerText,
      // image: `https:${item
      //   .querySelector("figure.img-wrap img")
      //   .getAttribute("src")}`,
      // link: `${baseUrl}${item
      //   .querySelector("a.item-title")
      //   .getAttribute("href")}`,
      // title: item.querySelector("a.item-title h3")?.textContent.trim() || "",
      // location:
      //   item
      //     .querySelector(".item-description span:first-child")
      //     ?.textContent.trim() || "",
      // description:
      //   item
      //     .querySelector(".item-description span:last-child")
      //     ?.textContent.trim() || "",
      // details: Array.from(item.querySelectorAll(".item-info-detail li")).map(
      //   item => item.textContent.trim()
      // ),
      // tags: Array.from(item.querySelectorAll(".item-tags span")).map(item =>
      //   item.textContent.trim()
      // ),
      // price: item.querySelector(".item-price .price-num").textContent.trim()
    }));
  }, baseUrl);
}
