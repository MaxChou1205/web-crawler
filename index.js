import "dotenv/config";
import { fetchList as fetchList_yungching } from "./pageParser_yungching.js";
import { fetchList as fetchList_sinyi } from "./pageParser_sinyi.js";
import {
  setSearchCondition,
  extractData as extractData_hb,
  nextPage,
} from "./pageParser_hb.js";
import { fetchList as fetchList_ct } from "./pageParser_ct.js";
import { fetchList as fetchList_591 } from "./pageParser_land_591.js";
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
const fetchYungChing = async (messages) => {
  const dataSource = await HouseYungChing.find({});

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
      const pageData = await fetchList_yungching(url);
      const difference = pageData.filter(
        (item) =>
          !dataSource.some((data) => data.link === item.link) &&
          !newData.some((data) => data.link === item.link)
      );

      newData.push(...difference);
      currentPage++;
    }
  }

  if (!dryRun) {
    await HouseYungChing.insertMany(newData);
  }

  if (newData.length === 0) {
    console.log("there is no new data in yungching");
  } else {
    messages.push(...newData);
    console.log("new data in yungching");
  }
};

// sinyi
const fetchSinyi = async (messages) => {
  const dataSource = await HouseSinyi.find({});

  // https://www.sinyi.com.tw/buy/list/800-1800-price/apartment-dalou-huaxia-type/NewTaipei-city/231-116-zip/publish-desc/1
  const newData = [];
  let currentPage = 1;
  const totalPages = 2;

  while (currentPage <= totalPages) {
    const url = `https://www.sinyi.com.tw/buy/list/800-2500-price/apartment-dalou-huaxia-type/NewTaipei-city/231-116-zip/publish-desc/${currentPage}`;
    const result = await fetchList_sinyi(url);
    const difference = result.filter(
      (item) =>
        !dataSource.some((data) => data.link === item.link) &&
        !newData.some((data) => data.link === item.link)
    );

    newData.push(...difference);
    currentPage++;
  }

  if (!dryRun) {
    await HouseSinyi.insertMany(newData);
  }

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
const fetchCt = async (messages) => {
  const dataSource = await HouseCt.find({});

  // https://buy.cthouse.com.tw/area/%E8%87%BA%E5%8C%97%E5%B8%82-city/%E6%96%87%E5%B1%B1%E5%8D%80-town/800-1800-price/%E9%9B%BB%E6%A2%AF%E5%A4%A7%E6%A8%93-%E5%85%AC%E5%AF%93-%E5%A5%97%E6%88%BF-type/1-ord/page1.html
  const newData = [];
  const regionList = ["臺北市-city/文山區-town", "新北市-city/新店區-town"];

  for (let region of regionList) {
    let currentPage = 1;
    const totalPages = 2;

    while (currentPage <= totalPages) {
      const arg = `${region}/800-2500-price/電梯大樓-公寓-套房-type/1-ord/page${currentPage}.html`;
      const result = await retry(() => fetchList_ct(arg, currentPage), 3);

      const difference = result.filter(
        (item) =>
          !dataSource.some((data) => data.link === item.link) &&
          !newData.some((data) => data.link === item.link)
      );

      newData.push(...difference);
      currentPage++;
    }
  }

  if (!dryRun) {
    await HouseCt.insertMany(newData);
  }

  if (newData.length === 0) {
    console.log("there is no new data in ct");
  } else {
    messages.push(...newData);
    console.log("new data in ct");
  }
};

const fetchLand591 = async (messages) => {
  const dataSource = await HouseLand591.find({});

  // https://land.591.com.tw/list?type=2&region=24&kind=11&aid=1969&page=1&section=283
  const newData = [];
  let currentPage = 1;
  const totalPages = 2;

  while (currentPage <= totalPages) {
    const url = `https://land.591.com.tw/list?type=2&region=24&kind=11&aid=1969&page=${currentPage}&section=283`;
    const result = await fetchList_591(url);
    const difference = result.filter(
      (item) =>
        !dataSource.some((data) => data.link === item.link) &&
        !newData.some((data) => data.link === item.link)
    );

    newData.push(...difference);
    currentPage++;
  }

  if (!dryRun) {
    await HouseLand591.insertMany(newData);
  }

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
      await client.multicast({
        to: process.env.USER_ID.split(','),
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

  const messages = [];
  try {
    console.log("running a task every hour");

    const results = await Promise.allSettled([
      fetchYungChing(messages),
      fetchSinyi(messages),
      fetchCt(messages),
      fetchLand591(messages),
    ]);
    results
      .filter((r) => r.status === "rejected")
      .forEach((r) => console.error(r.reason));

    // ponytail: hbhousing still needs a puppeteer browser; launch one here before re-enabling
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
    await sendMessage(messages);
    mongoose.connection.close();
  }
});
