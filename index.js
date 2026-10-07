import "dotenv/config";
import { fetchList as fetchList_yungching } from "./pageParser_yungching.js";
import { fetchList as fetchList_sinyi } from "./pageParser_sinyi.js";
import { fetchList as fetchList_hb } from "./pageParser_hb.js";
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

const pages = [1, 2];

// yungching
const fetchYungChing = async () => {
  const items = [];
  for (const region of ["新北市-新店區_c", "台北市-文山區_c"]) {
    for (const page of pages) {
      const url = `https://buy.yungching.com.tw/list/region/住宅_p/${encodeURIComponent(
        region
      )}/800-2500_price/?od=80&pg=${page}`;
      items.push(...(await fetchList_yungching(url)));
    }
  }
  return items;
};

// sinyi
// https://www.sinyi.com.tw/buy/list/800-1800-price/apartment-dalou-huaxia-type/NewTaipei-city/231-116-zip/publish-desc/1
const fetchSinyi = async () => {
  const items = [];
  for (const page of pages) {
    const url = `https://www.sinyi.com.tw/buy/list/800-2500-price/apartment-dalou-huaxia-type/NewTaipei-city/231-116-zip/publish-desc/${page}`;
    items.push(...(await fetchList_sinyi(url)));
  }
  return items;
};

// hbhousing
// https://www.hbhousing.com.tw/buyhouse/%E5%8F%B0%E5%8C%97%E5%B8%82/116/mansion-style/800-2500-price/2-page
const fetchHb = async () => {
  const items = [];
  for (const [city, zipCode] of [
    ["台北市", "116"],
    ["新北市", "231"],
  ]) {
    for (const page of pages) {
      const url = `https://www.hbhousing.com.tw/buyhouse/${city}/${zipCode}/mansion-style/800-2500-price/${page}-page`;
      items.push(...(await fetchList_hb(url)));
    }
  }
  return items;
};

// ct house
// https://buy.cthouse.com.tw/area/%E8%87%BA%E5%8C%97%E5%B8%82-city/%E6%96%87%E5%B1%B1%E5%8D%80-town/800-1800-price/%E9%9B%BB%E6%A2%AF%E5%A4%A7%E6%A8%93-%E5%85%AC%E5%AF%93-%E5%A5%97%E6%88%BF-type/1-ord/page1.html
const fetchCt = async () => {
  const items = [];
  for (const region of ["臺北市-city/文山區-town", "新北市-city/新店區-town"]) {
    for (const page of pages) {
      const arg = `${region}/800-2500-price/電梯大樓-公寓-套房-type/1-ord/page${page}.html`;
      items.push(...(await retry(() => fetchList_ct(arg, page), 3)));
    }
  }
  return items;
};

// land 591
// https://land.591.com.tw/list?type=2&region=24&kind=11&aid=1969&page=1&section=283
const fetchLand591 = async () => {
  const items = [];
  for (const page of pages) {
    const url = `https://land.591.com.tw/list?type=2&region=24&kind=11&aid=1969&page=${page}&section=283`;
    items.push(...(await fetchList_591(url)));
  }
  return items;
};

// Insert items whose link isn't in the collection yet and return them.
// The unique index on `link` plus upsert/$setOnInsert makes MongoDB do the dedupe:
// existing listings are left untouched, upsertedIds tells us which ones were new.
const saveNew = async (Model, items) => {
  const unique = [...new Map(items.map((item) => [item.link, item])).values()];
  if (unique.length === 0) return [];

  if (dryRun) {
    const existing = new Set(
      await Model.distinct("link", { link: { $in: unique.map((i) => i.link) } })
    );
    return unique.filter((item) => !existing.has(item.link));
  }

  const now = new Date();
  const result = await Model.bulkWrite(
    unique.map((item) => ({
      updateOne: {
        filter: { link: item.link },
        update: { $setOnInsert: { ...item, createdAt: now, updatedAt: now } },
        upsert: true,
      },
    })),
    { ordered: false }
  );
  return Object.keys(result.upsertedIds).map((index) => unique[index]);
};

const sites = [
  ["yungching", HouseYungChing, fetchYungChing],
  ["sinyi", HouseSinyi, fetchSinyi],
  ["ct", HouseCt, fetchCt],
  ["land591", HouseLand591, fetchLand591],
  ["hbhouse", HouseHbhousing, fetchHb],
];

const crawl = async ([name, Model, fetchAll], messages) => {
  const newData = await saveNew(Model, await fetchAll());
  if (newData.length === 0) {
    console.log(`there is no new data in ${name}`);
  } else {
    messages.push(...newData);
    console.log(`${newData.length} new data in ${name}`);
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

    // make sure the unique link indexes exist before relying on them
    await Promise.all(sites.map(([, Model]) => Model.init()));

    const results = await Promise.allSettled(
      sites.map((site) => crawl(site, messages))
    );
    results
      .filter((r) => r.status === "rejected")
      .forEach((r) => console.error(r.reason));

    console.log("task done");
  } catch (error) {
    console.error(error);
  } finally {
    await sendMessage(messages);
    mongoose.connection.close();
  }
});
