export async function setSearchCondition(page, city, area) {
  // 城市
  await page.click(".selectform.selectpush.where:nth-child(2) > span"); // 展開城市下拉選單
  await page.evaluate((city) => {
    const options = document.querySelectorAll("#sel_city li");
    const element = [...options].find(
      (option) => option.textContent.trim() === city
    );
    element?.querySelector("input").click();
  }, city);
  await page.waitForNetworkIdle();

  // 區域
  await page.waitForSelector("#sel_area");
  await page.click(".selectform.selectpush.where:nth-child(3) > span"); // 展開區域下拉選單
  await page.evaluate((area) => {
    const options = document.querySelectorAll("#sel_area li");
    const element = [...options].find(
      (option) => option.textContent.trim() === area
    );
    element?.querySelector("input").click();
  }, area);
  await page.waitForNetworkIdle();

  // 選擇類別為住宅
  await page.waitForSelector(".search-check");
  await page.evaluate(() => {
    const options = document.querySelectorAll(".search-check ul li");
    const element = [...options].find(
      (option) => option.textContent.trim() === "住宅"
    );
    if (element && !element.querySelector("input").checked)
      element?.querySelector("input").click();
  });
  await page.waitForNetworkIdle();

  // 設置總價範圍
  await page.click("input[name='q4'].lastOpt");
  await page.evaluate(() => {
    document.querySelector('input[name="q4L"]').value = "800";
  });
  await page.evaluate(() => {
    document.querySelector('input[name="q4H"]').value = "2500";
  });
  await page.waitForNetworkIdle();

  // 設置排序方式為上架新>舊
  await page.click(".tab-container .selectform.selectpush");
  await page.evaluate(() => {
    document
      .querySelector(".selectpanel.selblock02 > li[data-value='-8']")
      .click();
  });
}

export async function extractData(page) {
  return await page.evaluate(() => {
    let result = [];
    const items = document.querySelectorAll(".\\@container");
    items.forEach((item) => {
      const titleElement = item.querySelector("h3 a");
      const title = titleElement?.textContent.trim();
      const link = titleElement?.href;

      const priceElement = item.querySelector(".text-error span");
      const price = priceElement?.textContent.trim();

      const addressElement = item.querySelector(
        ".attribute:nth-child(3) span:not(.font-montserrat)"
      );
      const address = addressElement?.textContent.trim();

      const descriptionElement = item.querySelector("p.attribute:nth-child(2)");
      const description = descriptionElement?.textContent.trim();

      const imageElements = item.querySelectorAll(".splide__list img");
      const images = Array.from(imageElements)
        .map((img) => img.src)
        .filter((src) => src);

      const details = item
        .querySelector(".attribute:nth-child(3) span")
        ?.textContent.trim()
        .split("|");

      const tagElements = item.querySelectorAll(".tag");
      const tags = Array.from(tagElements).map((tag) => tag.textContent.trim());

      result.push({
        image: images.length > 0 ? images[0] : "",
        link,
        title,
        price,
        location: address,
        description,
        details,
        tags,
      });
    });

    return result;
  });
}

export async function nextPage(page) {
  await page.click(".house__list__pagenum li[data-page='2']");
  await page.waitForNetworkIdle();
}
