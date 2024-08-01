export async function extractData(page, baseUrl) {
  return await page.evaluate((baseUrl) => {
    const items = Array.from(
      document.querySelectorAll(".l-item-list .m-list-item")
    );
    return items.map(item => ({
      image: `https:${item
        .querySelector("figure.img-wrap img")
        .getAttribute("src")}`,
      link: `${baseUrl}${item
        .querySelector("a.item-title")
        .getAttribute("href")}`,
      title: item.querySelector("a.item-title h3")?.textContent.trim() || "",
      location:
        item
          .querySelector(".item-description span:first-child")
          ?.textContent.trim() || "",
      description:
        item
          .querySelector(".item-description span:last-child")
          ?.textContent.trim() || "",
      details: Array.from(item.querySelectorAll(".item-info-detail li")).map(
        item => item.textContent.trim()
      ),
      tags: Array.from(item.querySelectorAll(".item-tags span")).map(item =>
        item.textContent.trim()
      ),
      price: item.querySelector(".item-price .price-num").textContent.trim()
    }));
  },baseUrl);
}
