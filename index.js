const fs = require("fs");
const puppeteer = require("puppeteer");
const pageParser = require("./pageParser");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  //如果為false則會開啟瀏覽器，適合用作於debug時。
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", request => {

    if (
      ["stylesheet", "font", "script"].indexOf(request.resourceType()) !== -1
    ) {
      request.abort();
    } else if (request.resourceType() === "image") {
      const url = request.url();
      if (url.includes("v1/image")) {
        request.continue();
      } else {
        request.abort();
      }
    } else {
      request.continue();
    }
  });

  const baseUrl = "https://buy.yungching.com.tw";
  const searchUrl = `${baseUrl}/region/%E6%96%B0%E5%8C%97%E5%B8%82-%E6%96%B0%E5%BA%97%E5%8D%80_c/800-1200_price/?od=80`;
  let currentPage = 1;
  const totalPages = 3; // 假設總共有 5 頁

  const data = [];

  while (currentPage <= totalPages) {
    const url = `${searchUrl}&pg=${currentPage}`;
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    await page.waitForSelector(".l-item-list");

    // 取得元素內容
    const pageData = await page.evaluate(baseUrl => {
      const elements = Array.from(
        document.querySelectorAll(".l-item-list .m-list-item")
      );

      // 定義一個輔助函式來取得元素文本內容
      const getText = (element, selector) => {
        const selectedElement = element.querySelector(selector);
        return selectedElement ? selectedElement.innerText.trim() : "";
      };

      // 取得所有項目的資訊
      const items = elements.map(element => {
        // const imageElement = element.querySelector('figure.img-wrap img');
        // const imageSrc = await page.evaluate((img) => img.getAttribute('src'), imageElement);

        return {
          image: element
            .querySelector("figure.img-wrap img")
            .getAttribute("src"),
          link: `${baseUrl}${element
            .querySelector("a.item-title")
            .getAttribute("href")}`,
          title: getText(element, "a.item-title h3"),
          location: getText(element, ".item-description span:first-child"),
          description: getText(element, ".item-description span:last-child"),
          details: Array.from(
            element.querySelectorAll(".item-info-detail li")
          ).map(li => li.innerText.trim()),
          tags: Array.from(element.querySelectorAll(".item-tags span")).map(
            span => span.innerText.trim()
          ),
          price: getText(element, ".item-price .price-num")
        };
      });

      return items;
    }, baseUrl);

    data.push(...pageData);
    currentPage++;
  }

  console.log(data);
  fs.writeFileSync("data.json", JSON.stringify(data));

  await browser.close();
})();
