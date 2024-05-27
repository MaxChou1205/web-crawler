export async function setSearchCondition(page, city, area) {
  // 城市
  await page.click(".selectform.selectpush.where:nth-child(2) > span"); // 展開城市下拉選單
  await page.evaluate(city => {
    const options = document.querySelectorAll("#sel_city li");
    const element = [...options].find(
      option => option.textContent.trim() === city
    );
    element?.querySelector("input").click();
  }, city);
  await page.waitForNetworkIdle();

  // 區域
  await page.waitForSelector("#sel_area");
  await page.click(".selectform.selectpush.where:nth-child(3) > span"); // 展開區域下拉選單
  await page.evaluate(area => {
    const options = document.querySelectorAll("#sel_area li");
    const element = [...options].find(
      option => option.textContent.trim() === area
    );
    element?.querySelector("input").click();
  }, area);
  await page.waitForNetworkIdle();

  // 選擇類別為住宅
  await page.waitForSelector(".search-check");
  await page.evaluate(() => {
    const options = document.querySelectorAll(".search-check ul li");
    const element = [...options].find(
      option => option.textContent.trim() === "住宅"
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
    document.querySelector('input[name="q4H"]').value = "1800";
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
    // for (let i = 0; i < 2; i++) {
    const items = document.querySelectorAll(".house__list__item");
    items.forEach(item => {
      const titleElement = item.querySelector(".item__header__tit a");
      const link =
        titleElement?.href.indexOf("&") > -1
          ? titleElement?.href.substring(0, titleElement?.href.indexOf("&"))
          : titleElement?.href;
      const priceElement = item.querySelector(
        ".item__info__header .hlight.color--red"
      );
      const addressElement = item.querySelector(
        ".item__info__table ul li:first-child"
      );
      const descriptionElement = item.querySelector(".item-intro .item__intro");
      const imageElements = item.querySelectorAll(
        ".item__photo img, .item__pattern img"
      );

      const images = [...imageElements]
        .filter(img => /\.jpg\?\d+/.test(img.src))
        .map(img => img.src || img.getAttribute("rel"));

      const details = item.querySelectorAll(".item__info__table ul li");

      const tempTags = [...item.querySelectorAll(".item__info__header > span")]
        .slice(2)
        .map(item => item.textContent);
      const tags = [tempTags.slice(0, 6).join(""), tempTags.slice(6).join("")];

      result.push({
        image: images.length > 0 ? images[0] : "",
        link,
        title: titleElement?.innerText.trim(),
        price: priceElement.textContent.trim(),
        location: addressElement?.innerText.trim(),
        description: descriptionElement?.innerText.trim(),
        details: [...details]
          .map(item => item.innerText.trim())
          .slice(1)
          .concat(tags),
        tags
      });
    });

    // document.querySelector(".house__list__pagenum li[data-page='2']").click();
    // await page.waitForNetworkIdle();
    // }
    return result;
  });
}

export async function nextPage(page) {
  await page.click(".house__list__pagenum li[data-page='2']");
  await page.waitForNetworkIdle();
}
