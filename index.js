import "dotenv/config";
import fs from "fs";
import puppeteer from "puppeteer";
import { pageParser } from "./pageParser.js";
import { pageParser as pageParser_sinyi } from "./pageParser_sinyi.js";
import * as line from "@line/bot-sdk";
import { flexTemplate } from "./flexTemplate.js";
import cron from "node-cron";
import mongoose from "mongoose";
import { HouseYungChing, HouseSinyi } from "./model/houseData.js";

// yungching
const fetchData = async () => {
  const dataSource = await HouseYungChing.find({});
  const browser = await puppeteer.launch({
    headless: true,
    // ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "single-process",
      "--use-gl=egl",
      "--no-zygote"
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()
  });
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

  await HouseYungChing.insertMany(newData);
  await browser.close();

  if (newData.length === 0) {
    console.log("there is no new data in yungching");
  } else {
    const MessagingApiClient = line.messagingApi.MessagingApiClient;
    const client = new MessagingApiClient({
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
    });

    let messages = [];
    for (let i = 0; i < newData.length; i += 12) {
      messages = newData.slice(i, i + 12);
      const flexMessage = flexTemplate(messages);
      client.pushMessage({
        to: process.env.USER_ID,
        messages: [flexMessage]
      });
    }
  }
};

// sinyi
const fetchData2 = async () => {
  const dataSource = await HouseSinyi.find({});
  const browser = await puppeteer.launch({
    headless: true,
    // ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "single-process",
      "--use-gl=egl",
      "--no-zygote"
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()
  });
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

  // https://www.sinyi.com.tw/buy/list/800-1800-price/apartment-dalou-huaxia-type/NewTaipei-city/231-116-zip/publish-desc/1
  const newData = [];
  let currentPage = 1;
  const totalPages = 2;

  while (currentPage <= totalPages) {
    const url = `https://www.sinyi.com.tw/buy/list/800-1800-price/apartment-dalou-huaxia-type/NewTaipei-city/231-116-zip/publish-desc/${currentPage}`;
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    await page.waitForSelector(".buy-list-frame");

    const pageData = (await page.evaluate(pageParser_sinyi)).data;
    const difference = pageData.filter(
      item => !dataSource.some(data => data.link === item.link)
    );

    newData.push(...difference);
    currentPage++;
  }

  await HouseSinyi.insertMany(newData);
  await browser.close();

  if (newData.length === 0) {
    console.log("there is no new data in sinyi");
  } else {
    const MessagingApiClient = line.messagingApi.MessagingApiClient;
    const client = new MessagingApiClient({
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
    });

    let messages = [];
    for (let i = 0; i < newData.length; i += 12) {
      messages = newData.slice(i, i + 12);
      const flexMessage = flexTemplate(messages);
      client.pushMessage({
        to: process.env.USER_ID,
        messages: [flexMessage]
      });
    }
  }
};

const db = process.env.DATABASE;
mongoose.connect(db).then(con => {
  console.log("db connected");
  cron.schedule(
    // execute every one hour
    "0 * * * *",
    async () => {
      try {
        console.log("running a task every hour");
        await fetchData();
        await fetchData2();

        // const dataSource = JSON.parse(fs.readFileSync("./data.json"));
        // await HouseYungChing.deleteMany({});
        // await HouseYungChing.insertMany(dataSource);

        // const dataSource1 = JSON.parse(fs.readFileSync("./data_sinyi.json"));
        // await HouseSinyi.deleteMany({});
        // await HouseSinyi.insertMany(dataSource1);

        console.log("task done");
      } catch (error) {
        console.error(error);
      }
    },
    { runOnInit: true }
  );
});
