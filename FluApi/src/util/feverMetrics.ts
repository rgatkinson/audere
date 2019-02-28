"use strict";
import { EventInfo } from "audere-lib/snifflesProtocol";
const excel = require("node-excel-export");

const Client = require("pg-native");
const client = new Client();
const conString = process.env.NONPII_DATABASE_URL;
client.connectSync(conString);

const STUDY_TIMEZONE = "America/Los_Angeles";
const moment = require("moment-timezone");

// Returns yyyy-MM-dd string
export function getFeverToday(): string {
  return moment()
    .tz(STUDY_TIMEZONE)
    .format("YYYY-MM-DD");
}

/**
 * Returns [+-]HH timezone offset string for consumption in SQL timestamp string
 * e.g. "-08" if PST, "-07" if PDT
 */
function getStudyTimezoneOffset(): string {
  const offset = moment
    .tz(moment.utc(), STUDY_TIMEZONE)
    .format("ZZ")
    .substring(0, 3);
  return offset;
}

function toStudyDateString(date: Date): string {
  return moment(date)
    .tz(STUDY_TIMEZONE)
    .format("YYYY-MM-DD HH:mm:ss");
}

function getTimezoneAbbrev(): string {
  return moment()
    .tz(STUDY_TIMEZONE)
    .format("z");
}

export function getFeverMetrics(
  startDate: string,
  endDate: string
): [object] {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;
  const demoClause =
    "((survey->>'isDemo')::boolean IS FALSE)";

  function getSurveyStatsQuery(): string {
    return `
      SELECT 
        COUNT(*) as total, 
        SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"Consent"}]' THEN 1 END) as eligible,
        SUM(CASE WHEN survey->'consents'->0->'date' IS NOT NULL THEN 1 END) as consents,
        SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"Confirmation"}]' THEN 1 END) as kits,
        SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"WelcomeBack"}]' THEN 1 END) as part2,
        SUM(CASE WHEN survey->'samples'->0->'code' IS NOT NULL THEN 1 END) as scanned,
        SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"ThankYouSurvey"}]' THEN 1 END) as surveyscompleted,
        SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"FirstTestFeedback"}]' THEN 1 END) as test1,
        SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"SecondTestFeedback"}]' THEN 1 END) as test2,
        SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"Thanks"}]' THEN 1 END) as kitsreturned
      FROM fever_current_surveys
      WHERE ${dateClause} AND ${demoClause};`;
  }
  const surveyStatsData = client.querySync(getSurveyStatsQuery());

  return [
    surveyStatsData
  ];
}

export function getFeverExcelReport(startDate: string, endDate: string) {
  const [
    surveyStatsData
  ] = getFeverMetrics(startDate, endDate);

  const styles = {
    small: {
      font: { sz: 11 }
    },
    default: {},
    title: {
      font: { sz: 14 }
    },
    columnHeader: {
      fill: { fgColor: { rgb: "FF4b2e83" } },
      font: { color: { rgb: "FFFFFFFF" }, underline: true }
    }
  };

  const defaultCell = {
    headerStyle: styles.columnHeader,
    width: 70,
    cellStyle: function(value, row) {
      return { alignment: { horizontal: "right" } };
    }
  };
  const surveyStatsSpec = {
    total: {
      displayName: "Started Part 1",
      ...defaultCell
    },
    eligible: {
      displayName: "Eligible",
      ...defaultCell
    },
    consents: {
      displayName: "Consented",
      ...defaultCell
    },
    kits: {
      displayName: "Ordered Kit",
      ...defaultCell
    },
    part2: {
      displayName: "Started Part 2",
      ...defaultCell
    },
    scanned: {
      displayName: "Barcode Scanned",
      ...defaultCell
    },
    surveyscompleted: {
      displayName: "Completed Questionnaire",
      ...defaultCell
    },
    test1: {
      displayName: "Test 1 Complete",
      ...defaultCell
    },
    test2: {
      displayName: "Test 2 Complete",
      ...defaultCell
    },
    kitsreturned: {
      displayName: "Kit Returned",
      ...defaultCell
    }
  };

  const dateRangeHeading = {
    value: "Data from " + startDate + " to " + endDate,
    style: styles.title
  };
  const generatedHeading = {
    value: "Report generated " + toStudyDateString(new Date()),
    style: styles.default
  };
  const surveyStatsHeading = [
    [{ value: "Fever Stats", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const helpHeading = [
    [{ value: "Explanation of Metrics Columns", style: styles.title }],
    [
      "Started Part 1",
      null,
      "How many started, i.e. clicked beyond Welcome page"
    ],
    [
      "Eligible",
      null,
      "How many eligible to participate (reported cough and at least 1 other symptom)"
    ],
    ["Consented", null, "How many signed the consent form"],
    ["Ordered Kit", null, "How many input their address to order a kit"],
    ["Started Part 2", null, "How many reopened the app to find Welcome Back screen"],
    ["Barcode Scanned", null, "How many scanned or manually entered a barcode"],
    [
      "Completed Questionnaire",
      null,
      "How many completed the questionnaire, i.e. got to the MedicalInsurance question"
    ],
    [
      "Test 1 Complete", 
      null, 
      "How many made it to the survey question at the end of the first test"
    ],
    [
      "Test 2 Complete",
      null,
      "How many made it to the survey question at the end of the second test"
    ],
    ["Kits Returned", null, "How many made it to the last screen"],
  ];

  const merges = [
    { start: { row: 1, column: 1 }, end: { row: 1, column: 10 } },
    { start: { row: 2, column: 1 }, end: { row: 2, column: 10 } },
    { start: { row: 3, column: 1 }, end: { row: 3, column: 10 } }
  ];
  const helpMerges = [
    { start: { row: 1, column: 1 }, end: { row: 1, column: 13 } }
  ];

  const report = excel.buildExport([
    {
      name: "Fever Metrics",
      merges: merges,
      heading: surveyStatsHeading,
      specification: surveyStatsSpec,
      data: surveyStatsData
    },
    {
      name: "Help",
      merges: helpMerges,
      heading: helpHeading,
      specification: {},
      data: []
    }
  ]);

  return report;
}