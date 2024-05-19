export function pageParser(baseUrl) {
  const getText = (element, selector) => {
    const selectedElement = element.querySelector(selector);
    return selectedElement ? selectedElement.innerText.trim() : "";
  };
  const parser = () => {
    const elements = Array.from(
      document.querySelectorAll(".l-item-list .m-list-item")
    );

    // 取得所有項目的資訊
    const items = elements.map(element => {
      // const imageElement = element.querySelector('figure.img-wrap img');
      // const imageSrc = await page.evaluate((img) => img.getAttribute('src'), imageElement);

      return {
        image: `https:${element
          .querySelector("figure.img-wrap img")
          .getAttribute("src")}`,
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
  };

  return {
    data: parser()
  };
}
