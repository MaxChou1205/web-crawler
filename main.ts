// Deno.cron("Log a message", "*/1 * * * *", () => {
//   console.log("This will print once a minute.");
// });

import mongoose from "npm:mongoose@8.4.0";
const client = await mongoose.connect("mongodb+srv://max:Czb4B3dhAHnebynd@cluster0.dxzwadl.mongodb.net/web-crawler",{
  authMechanism: "SCRAM-SHA-1",
  connectTimeoutMS: 10000
});
console.log(client.connection.readyState);


// import * as mongo from "@db/mongo";

// const client = new mongo.MongoClient();
// await client.connect("mongodb+srv://max:Czb4B3dhAHnebynd@cluster0.dxzwadl.mongodb.net/web-crawler?authMechanism=SCRAM-SHA-1");


// const databases = await client.listDatabases();
// console.log(databases);