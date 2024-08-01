export async function extractData(page) {
  return await page.evaluate(() => {
    const items = Array.from(
      document.querySelectorAll("[id^='buyHouseCard_']")
    );
    return items.map(item => {
      let cardElement = item.querySelector(".LongInfoCard_TypeWeb");
      return {
        image: item.querySelector(".largeImg img").src,
        link: item.querySelector("a").href,
        title: cardElement
          .querySelector(".LongInfoCard_Type_Name")
          .textContent.trim(),
        price: cardElement
          .querySelector(".LongInfoCard_Type_Right span:first-child")
          .textContent.trim(),
        location: cardElement
          .querySelector(".LongInfoCard_Type_Address span:first-child")
          .textContent.trim(),
        description:
          cardElement
            .querySelector(".LongInfoCard_Type_Address span:nth-child(2)")
            .textContent.trim() +
          "|" +
          cardElement
            .querySelector(".LongInfoCard_Type_Address span:nth-child(3)")
            .textContent.trim(),
        details: Array.from(
          cardElement.querySelectorAll(".LongInfoCard_Type_HouseInfo span")
        ).map(item => item.textContent.trim()),
        tags: Array.from(
          cardElement.querySelectorAll(
            ".LongInfoCard_Type_SpecificTags .specificTag"
          )
        ).map(item => item.textContent.trim())
      };
    });
  });
}
