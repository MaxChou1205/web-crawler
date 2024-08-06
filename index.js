import "dotenv/config";
import puppeteer from "puppeteer";
import { extractData as extractData_yungching } from "./pageParser_yungching.js";
import { extractData as extractData_sinyi } from "./pageParser_sinyi.js";
import {
  setSearchCondition,
  extractData as extractData_hb,
  nextPage
} from "./pageParser_hb.js";
import { extractData as extractData_ct } from "./pageParser_ct.js";
import * as line from "@line/bot-sdk";
import { flexTemplate } from "./flexTemplate.js";
import cron from "node-cron";
import express from "express";
import mongoose from "mongoose";
import {
  HouseYungChing,
  HouseSinyi,
  HouseHbhousing,
  HouseCt
} from "./model/houseData.js";

// yungching
const fetchYungChing = async (browser, messages) => {
  const dataSource = await HouseYungChing.find({});
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
    )}/800-2500_price/?od=80`;
    let currentPage = 1;
    const totalPages = 2;

    while (currentPage <= totalPages) {
      const url = `${searchUrl}&pg=${currentPage}`;
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 0
      });

      await page.waitForSelector(".l-item-list");

      const pageData = await extractData_yungching(page, baseUrl);
      const difference = pageData.filter(
        item => !dataSource.some(data => data.link === item.link)
      );

      newData.push(...difference);
      currentPage++;
    }
  }

  await HouseYungChing.insertMany(newData);
  page.close();

  if (newData.length === 0) {
    console.log("there is no new data in yungching");
  } else {
    messages.push(...newData);
    console.log("new data in yungching");
  }
};

// sinyi
const fetchSinyi = async (browser, messages) => {
  const dataSource = await HouseSinyi.find({});
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
    const url = `https://www.sinyi.com.tw/buy/list/800-2500-price/apartment-dalou-huaxia-type/NewTaipei-city/231-116-zip/publish-desc/${currentPage}`;
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    await page.waitForSelector(".buy-list-frame");

    const result = await extractData_sinyi(page);
    const difference = result.filter(
      item => !dataSource.some(data => data.link === item.link)
    );

    newData.push(...difference);
    currentPage++;
  }

  await HouseSinyi.insertMany(newData);
  page.close();

  if (newData.length === 0) {
    console.log("there is no new data in sinyi");
  } else {
    messages.push(...newData);
    console.log("new data in sinyi");
  }
};

// hbhousing
const fetchHb = async (browser, messages) => {
  const dataSource = await HouseHbhousing.find({});
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  await page.setRequestInterception(true);
  page.on("request", request => {
    if (
      ["font", "image", "stylesheet"].indexOf(request.resourceType()) !== -1
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

  const url = `https://www.hbhousing.com.tw/BuyHouse/`;
  await page.goto(url, {
    waitUntil: "load",
    timeout: 0
  });
  await page.waitForSelector("#MainContent_searchbox_container");

  const result = [];
  await setSearchCondition(page, "台北市", "文山區");
  await page.waitForNetworkIdle();
  result.push(...(await extractData_hb(page)));
  await nextPage(page);
  result.push(...(await extractData_hb(page)));

  await setSearchCondition(page, "新北市", "新店區");
  await page.waitForNetworkIdle();
  result.push(...(await extractData_hb(page)));
  await nextPage(page);
  result.push(...(await extractData_hb(page)));

  const difference = result.filter(
    item => !dataSource.some(data => data.link === item.link)
  );

  await HouseHbhousing.insertMany(difference);
  page.close();

  if (difference.length === 0) {
    console.log("there is no new data in hbhouse");
  } else {
    messages.push(...difference);
    console.log("new data in hbhouse");
  }
};

// ct house
const fetchCt = async (browser, messages) => {
  const dataSource = await HouseCt.find({});
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
  );
  await page.setRequestInterception(true);
  page.on("request", request => {
    if (["font", "image"].indexOf(request.resourceType()) !== -1) {
      request.abort();
    } else if (
      request.url().includes("analytics") ||
      request.url().includes("google")
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

  // https://buy.cthouse.com.tw/area/%E8%87%BA%E5%8C%97%E5%B8%82-city/%E6%96%87%E5%B1%B1%E5%8D%80-town/800-1800-price/%E9%9B%BB%E6%A2%AF%E5%A4%A7%E6%A8%93-%E5%85%AC%E5%AF%93-%E5%A5%97%E6%88%BF-type/1-ord/page1.html
  const newData = [];
  const baseUrl = "https://buy.cthouse.com.tw/area";
  const regionList = ["臺北市-city/文山區-town", "新北市-city/新店區-town"];

  for (let region of regionList) {
    let currentPage = 1;
    const totalPages = 2;

    while (currentPage <= totalPages) {
      const url = `${baseUrl}/${region}/800-2500-price/電梯大樓-公寓-套房-type/1-ord/page${currentPage}.html`;
      await page.goto(url, {
        waitUntil: "load",
        timeout: 0
      });

      await retry(
        async () =>
          await page.waitForResponse(response =>
            response.url().includes("/api/house_list.ashx")
          ),
        3
      );

      const result = await extractData_ct(page);

      const difference = result.filter(
        item => !dataSource.some(data => data.link === item.link)
      );

      newData.push(...difference);
      currentPage++;
    }
  }

  await HouseCt.insertMany(newData);
  page.close();

  if (newData.length === 0) {
    console.log("there is no new data in ct");
  } else {
    messages.push(...newData);
    console.log("new data in ct");
  }
};

const sendMessage = async messages => {
  const MessagingApiClient = line.messagingApi.MessagingApiClient;
  const client = new MessagingApiClient({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
  });

  for (let i = 0; i < messages.length; i += 12) {
    const currentBatch = messages.slice(i, i + 12);
    const flexMessage = flexTemplate(currentBatch);
    try {
      await client.pushMessage({
        to: process.env.USER_ID,
        messages: [flexMessage]
      });
    } catch (err) {
      console.error(err);
    }
  }

  if (messages.length > 0) {
    console.log("messages sent");
  }
};

const retry = async (promiseFactory, retryCount) => {
  try {
    return await promiseFactory();
  } catch (error) {
    if (retryCount <= 0) {
      throw error;
    }
    return await retry(promiseFactory, retryCount - 1);
  }
};

const db = process.env.DATABASE;
mongoose.connect(db).then(con => {
  console.log("db connected");
  cron.schedule(
    // execute every one hour
    "0 * * * *",
    async () => {
      const browser = await puppeteer.launch({
        headless: true,
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
      const messages = [];
      try {
        console.log("running a task every hour");

        await fetchYungChing(browser, messages);
        await fetchSinyi(browser, messages);
        await fetchHb(browser, messages);
        await fetchCt(browser, messages);

        // const dataSource = JSON.parse(fs.readFileSync("./data.json"));
        // await HouseYungChing.deleteMany({});
        // await HouseYungChing.insertMany(dataSource);

        // const dataSource1 = JSON.parse(fs.readFileSync("./data_sinyi.json"));
        // await HouseSinyi.deleteMany({});
        // await HouseSinyi.insertMany(dataSource1);

        console.log("task done");
      } catch (error) {
        console.error(error);
      } finally {
        browser.close();
        await sendMessage(messages);
        messages = [];
      }
    },
    { runOnInit: true }
  );
});

const app = express();
app.listen(3000);
