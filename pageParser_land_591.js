export async function extractData(page) {
  return await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll(".list-wrapper .item"));
    return items.map((item) => {
      // 獲取圖片 URL (使用 data-src 而非 src，因為圖片是懶加載的)
      const imageElements = Array.from(
        item.querySelectorAll(".image-list li img")
      );
      const images = Array.from(imageElements).map(
        (img) => img.getAttribute("data-src") || img.getAttribute("src")
      );

      // 獲取連結
      const link = item.querySelector(".item-info-title-content a")?.href || "";

      // 獲取標題
      const title =
        item.querySelector(".item-info-title-content a")?.textContent.trim() ||
        "";

      // 獲取價格
      const priceElement = item.querySelector(".item-info-price>div");
      const price = priceElement
        ? priceElement.textContent.trim().replace(/萬/g, "")
        : "";

      const details = Array.from(
        item.querySelectorAll(".item-info .item-info-txt:nth-child(1) span")
      ).map((span) => span.textContent.trim());

      const address =
        item
          .querySelector(".item-info .item-info-txt:nth-child(2)")
          ?.textContent.trim() || "";

      const tags = Array.from(item.querySelectorAll(".item-info-tag .tag")).map(
        (tag) => tag.textContent.trim()
      );

      return {
        images,
        link,
        title,
        price,
        location: address,
        description: "",
        details,
        tags,
      };
    });
  });
}
