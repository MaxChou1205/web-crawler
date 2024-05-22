export function pageParser() {
  const parser = () => {
    const elements = Array.from(
      document.querySelectorAll("[id^='buyHouseCard_']")
    );

    const items = elements.map(element => {
      let cardElement = element.querySelector(".LongInfoCard_TypeWeb");
      return {
        image: element.querySelector(".largeImg img").src,
        link: element.querySelector("a").href,
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
        ).map(span => span.textContent.trim()),
        tags: Array.from(
          cardElement.querySelectorAll(
            ".LongInfoCard_Type_SpecificTags .specificTag"
          )
        ).map(span => span.textContent.trim())
      };
    });

    return items;
  };

  return {
    data: parser()
  };
}
