import "dotenv/config";
import puppeteer from "puppeteer";
import { extractData as extractData_yungching } from "./pageParser_yungching.js";
import { extractData as extractData_sinyi } from "./pageParser_sinyi.js";
import {
  setSearchCondition,
  extractData as extractData_hb,
  nextPage,
} from "./pageParser_hb.js";
import { extractData as extractData_ct } from "./pageParser_ct.js";
import { extractData as extractData_591 } from "./pageParser_land_591.js";
import * as line from "@line/bot-sdk";
import { flexTemplate } from "./flexTemplate.js";
import mongoose from "mongoose";
import {
  HouseYungChing,
  HouseSinyi,
  HouseHbhousing,
  HouseCt,
  HouseLand591,
} from "./model/houseData.js";

// yungching
const fetchYungChing = async (browser, messages) => {
  const dataSource = await HouseYungChing.find({});
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
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
  const baseUrl = "https://buy.yungching.com.tw/list";
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
        timeout: 0,
      });

      // await page.waitForSelector("[class*='buy-list']");

      const pageData = await extractData_yungching(page, baseUrl);
      const difference = pageData.filter(
        (item) => !dataSource.some((data) => data.link === item.link)
      );

      newData.push(...difference);
      currentPage++;
    }
  }

  if (!dryRun) {
    await HouseYungChing.insertMany(newData);
  }
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
  page.on("request", (request) => {
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
      timeout: 0,
    });

    await page.waitForSelector("[class*='buy-list-frame']");

    const result = await extractData_sinyi(page);
    const difference = result.filter(
      (item) => !dataSource.some((data) => data.link === item.link)
    );

    newData.push(...difference);
    currentPage++;
  }

  if (!dryRun) {
    await HouseSinyi.insertMany(newData);
  }
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
  page.on("request", (request) => {
    if (
      ["font", "image", "stylesheet"].indexOf(request.resourceType()) !== -1
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

  // https://www.hbhousing.com.tw/buyhouse/%E5%8F%B0%E5%8C%97%E5%B8%82/116/mansion-style/800-2500-price/2-page

  const newData = [];
  const totalPages = 2;
  const addressEntries = [
    { zipCode: "116", address: "台北市" },
    { zipCode: "231", address: "新北市" },
  ];

  for (const addressEntry of addressEntries) {
    let currentPage = 1;
    while (currentPage <= totalPages) {
      const url = `https://www.hbhousing.com.tw/buyhouse/${addressEntry.address}/${addressEntry.zipCode}/mansion-style/800-2500-price/${currentPage}-page`;
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });

      // await page.waitForSelector(
      //   ".container-max-w.relative.z-10.scroll-to-item-wrapper"
      // );

      const result = await extractData_hb(page);
      const difference = result.filter(
        (item) => !dataSource.some((data) => data.link === item.link)
      );

      newData.push(...difference);
      currentPage++;
    }
  }

  if (!dryRun) {
    await HouseHbhousing.insertMany(newData);
  }
  page.close();

  if (newData.length === 0) {
    console.log("there is no new data in hbhouse");
  } else {
    messages.push(...newData);
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
  page.on("request", (request) => {
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
        timeout: 0,
      });

      await retry(
        async () =>
          await page.waitForResponse((response) =>
            response.url().includes("/api/house_list.ashx")
          ),
        3
      );

      const result = await extractData_ct(page);

      const difference = result.filter(
        (item) => !dataSource.some((data) => data.link === item.link)
      );

      newData.push(...difference);
      currentPage++;
    }
  }

  if (!dryRun) {
    await HouseCt.insertMany(newData);
  }
  page.close();

  if (newData.length === 0) {
    console.log("there is no new data in ct");
  } else {
    messages.push(...newData);
    console.log("new data in ct");
  }
};

const fetchLand591 = async (browser, messages) => {
  const dataSource = await HouseLand591.find({});
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
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

  // https://land.591.com.tw/list?type=2&region=24&kind=11&aid=1969&gad_source=1&gad_campaignid=20946223595&gbraid=0AAAAAD-HmYBnbbwyn_eMwBRjR5eRCZJML&gclid=CjwKCAjw3rnCBhBxEiwArN0QE3Vg7BQ0lRCBEtBjqabggkyOe2ZbXY9Si5kFToWj5mO4mz4e7Dpv1hoCg4UQAvD_BwE&page=1&section=283
  const newData = [];
  let currentPage = 1;
  const totalPages = 2;

  while (currentPage <= totalPages) {
    const url = `https://land.591.com.tw/list?type=2&region=24&kind=11&aid=1969&gad_source=1&gad_campaignid=20946223595&gbraid=0AAAAAD-HmYBnbbwyn_eMwBRjR5eRCZJML&gclid=CjwKCAjw3rnCBhBxEiwArN0QE3Vg7BQ0lRCBEtBjqabggkyOe2ZbXY9Si5kFToWj5mO4mz4e7Dpv1hoCg4UQAvD_BwE&page=${currentPage}&section=283`;
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    await page.waitForSelector(".list-wrapper");

    const result = await extractData_591(page);
    const difference = result.filter(
      (item) => !dataSource.some((data) => data.link === item.link)
    );

    newData.push(...difference);
    currentPage++;
  }

  if (!dryRun) {
    await HouseLand591.insertMany(newData);
  }
  page.close();

  if (newData.length === 0) {
    console.log("there is no new data in land591");
  } else {
    messages.push(...newData);
    console.log("new data in land591");
  }
};

const sendMessage = async (messages) => {
  const MessagingApiClient = line.messagingApi.MessagingApiClient;
  const client = new MessagingApiClient({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  });

  for (let i = 0; i < messages.length; i += 12) {
    const currentBatch = messages.slice(i, i + 12);
    const flexMessage = flexTemplate(currentBatch);
    try {
      await client.pushMessage({
        to: process.env.USER_ID,
        messages: [flexMessage],
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
const dryRun = Number(process.env.DRY_RUN);

mongoose.connect(db).then(async () => {
  console.log("db connected");

  const browser = await puppeteer.launch({
    headless: dryRun ? false : true,
    timeout: 0,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "single-process",
      "--use-gl=egl",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  browser.on("targetcreated", async (target) => {
    const newPage = await target.page();
    if (newPage) {
      const newPageUrl = newPage.url();
      if (newPageUrl.includes("https://events.hbhousing.com.tw/")) {
        await newPage.close();
      }
    }
  });

  browser.userAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
  );

  const messages = [];
  try {
    console.log("running a task every hour");

    await Promise.allSettled([
      fetchYungChing(browser, messages),
      fetchSinyi(browser, messages),
      fetchCt(browser, messages),
      fetchLand591(browser, messages),
    ]);

    // await fetchHb(browser, messages);

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
    mongoose.connection.close();
  }
});
