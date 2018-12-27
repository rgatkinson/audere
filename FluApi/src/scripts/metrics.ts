const async = require("async");
"use strict";

function printUsageAndExit() {
  console.log(
    "Usage: yarn metrics <startDate> <endDate> where dates are yyyy-MM-dd"
  );
  console.log("       Note that endDate is NOT inclusive");
  process.exit(1);
}

const args = process.argv;
if (args.length != 4) {
  printUsageAndExit();
}
const startDate = args[2];
const endDate = args[3];
const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
  printUsageAndExit();
}

const { Client } = require("pg");
const conString = process.env.DATABASE_URL;

// Use 8am UTC which is midnight Seattle time
const whereDate = `"createdAt" > \'${startDate} 08:00:00.000+00\' and "createdAt" < \'${endDate} 08:00:00.000+00\'`;

const metricsQueries = [
  `select visit->>'location' as location, count(id) as formstarts, sum(case when visit->'consents'->0->'signature' is not null then 1 end) as consented, sum(case when visit->'samples'->0->'code' is not null then 1 end) barcodescanned, sum(json_array_length(visit->'responses'->0->'item')) as questionsanswered from visits where ${whereDate} group by visit->>'location';`
];

const client = new Client(conString);
client.connect();

client.query(metricsQueries[0], (err, res) => {
  console.log(err ? err.stack : res.rows);
});
client.end();
