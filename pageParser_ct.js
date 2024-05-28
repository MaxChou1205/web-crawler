export async function extractData(page) {
  return await page.evaluate(() => {
    let result = [];

    const items = document.querySelectorAll(".object-list-item");
    items.forEach(item => {
      result.push({
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
        location: item
          .querySelector(".object-info-top-addr")
          .textContent.trim(),
        description: "",
        details: [...item.querySelectorAll(".object-info-main-item")].map(
          item => item.textContent.trim().replace(/ /g,"").replace(/\n/g," ")
        ),
        tags: [...item.querySelectorAll(".object-tag a")]
          .map(item => item.textContent.trim())
          .filter(item => item)
      });
    });

    return result;
  });
}
