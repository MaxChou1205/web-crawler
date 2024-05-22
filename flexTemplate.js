export const flexTemplate = data => {
  return {
    type: "flex",
    altText: "找到新房子囉",
    contents: {
      type: "carousel",
      contents: data.map(item => ({
        type: "bubble",
        size: "micro",
        hero: {
          type: "image",
          url: item.image,
          size: "full",
          aspectMode: "cover",
          aspectRatio: "320:213",
          action: {
            type: "uri",
            label: "action",
            uri: item.link
          }
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: item.title,
              weight: "bold",
              size: "sm",
              wrap: true
            },
            ...item.details
              .filter(detail => detail)
              .map(detail => ({
                type: "text",
                text: detail,
                size: "xs",
                margin: "xs"
              })),
            {
              type: "text",
              text: `${item.price} 萬`,
              size: "md",
              margin: "md"
            },
          ]
        }
      }))
    }
  };
};
