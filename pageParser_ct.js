export async function extractData(page) {
  return await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll(".object-list-item"));
    return items.map(item => ({
      image: item
        .querySelector(".object-preview-image img")
        .getAttribute("ng-src"),
      link: item.getAttribute("data-url"),
      title: item
        .querySelector(".object-info-top-title span")
        .textContent.trim(),
      price: item
        .querySelector(".object-info-top-right-price")
        .textContent.trim(),
      location: item.querySelector(".object-info-top-addr").textContent.trim(),
      description: "",
      details: Array.from(item.querySelectorAll(".object-info-main-item")).map(
        item => item.textContent.trim().replace(/ /g, "").replace(/\n/g, " ")
      ),
      tags: Array.from(item.querySelectorAll(".object-tag a"))
        .map(item => item.textContent.trim())
        .filter(Boolean)
    }));
  });
}
