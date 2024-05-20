import "dotenv/config";
import fs from "fs";
import puppeteer from "puppeteer";
import { pageParser } from "./pageParser.js";
import * as line from "@line/bot-sdk";
import { flexTemplate } from "./flexTemplate.js";

export default async function handler(req, res) {
  console.log('Cron job executed');
  const dataSource = JSON.parse(fs.readFileSync("data.json"));

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

  const newData = [];
  const baseUrl = "https://buy.yungching.com.tw";
  const regionList = ["新北市-新店區_c", "台北市-文山區_c"];

  for (let region of regionList) {
    const searchUrl = `${baseUrl}/region/住宅_p/${encodeURIComponent(
      region
    )}/800-1800_price/?od=80`;
    let currentPage = 1;
    const totalPages = 2;

    while (currentPage <= totalPages) {
      const url = `${searchUrl}&pg=${currentPage}`;
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 0
      });

      await page.waitForSelector(".l-item-list");

      const pageData = (await page.evaluate(pageParser, baseUrl)).data;
      const difference = pageData.filter(
        item => !dataSource.some(data => data.link === item.link)
      );

      newData.push(...difference);
      currentPage++;
    }
  }

  dataSource.push(...newData);
  fs.writeFileSync("data.json", JSON.stringify(dataSource));

  await browser.close();

  if (newData.length === 0) {
    console.log("No new data");
  } else {
    sendLineMessage();
  }
  res.status(200).json({ message: 'Cron job executed successfully' });
}

const sendLineMessage = () => {
  const MessagingApiClient = line.messagingApi.MessagingApiClient;
  const client = new MessagingApiClient({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
  });
  const flexMessage = flexTemplate();
  client.pushMessage({
    to: process.env.USER_ID,
    messages: [flexMessage]
  });
};