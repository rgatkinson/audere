// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { EventInfo } from "audere-lib/snifflesProtocol";
const excel = require("node-excel-export");

const Client = require("pg-native");
const client = new Client();
const clientPII = new Client();
const conString = process.env.NONPII_DATABASE_URL;
const conStringPII = process.env.PII_DATABASE_URL;
client.connectSync(conString);
clientPII.connectSync(conStringPII);

import { promisify } from "util";
import { Op } from "sequelize";
import { createSplitSql } from "../../util/sql";
import { defineFeverModels } from "../../models/db/fever";
import { SecretConfig } from "../../util/secretsConfig";
import { getBigqueryConfig } from "../../util/bigqueryConfig";
const {BigQuery} = require('@google-cloud/bigquery');
const sql = createSplitSql();

const STUDY_TIMEZONE = "America/Los_Angeles";
const moment = require("moment-timezone");

const clientQuery = promisify(client.query.bind(client));

// Returns yyyy-MM-dd string
export function getLastMonday(): string {
  var t = new Date();
  t.setDate(t.getDate() - t.getDay() + 1);
  return t.toISOString().slice(0, 10);
}

// Returns yyyy-MM-dd string
export function getThisSunday(): string {
  var t = new Date();
  t.setDate(t.getDate() - t.getDay() + 7);
  return t.toISOString().slice(0, 10);
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

export interface SnifflesMetrics {
  surveyStatsData: object;
  surveyStatsByAdminData: object;
  lastQuestionData: object;
  studyIdData: object;
  feedbackData: object;
}

export async function getMetrics(
  startDate: string,
  endDate: string
): Promise<SnifflesMetrics> {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;
  const demoClause =
    "(visit->'isDemo' IS NULL OR (visit->>'isDemo')::boolean IS FALSE)";

  function getSurveyStatsQuery(byField: string): string {
    return `
    WITH t AS (
      SELECT t1.grouping, t1.formstarts, t2.eligible, t1.consented, t2.completed, t1.specimenscanned, t3.giftcards, t2.adverseevents, t1.questionsanswered, t2.declinedresponses
      FROM (
        SELECT TRIM(COALESCE(visit->>'${byField}','')) AS grouping,
               COUNT(*) AS formstarts,
               SUM(CASE WHEN visit->'consents'->0->'terms' IS NOT NULL THEN 1 END) AS consented,
               SUM(CASE WHEN visit->'samples'->0->'code' IS NOT NULL THEN 1 END) AS specimenscanned,
               SUM(json_array_length(visit->'responses'->0->'item')) AS questionsanswered
        FROM visits
        WHERE ${dateClause} AND ${demoClause} AND visit->>'location' IS NOT NULL
        GROUP BY grouping
        ORDER BY grouping) t1
      LEFT JOIN (
        SELECT TRIM(COALESCE(visit->>'${byField}','')) AS grouping,
               SUM(CASE WHEN items->>'id'='MedicalInsurance' THEN 1 END) AS completed,
               SUM(CASE WHEN items->>'id'='WhichProcedures' THEN 1 END) AS adverseevents,
               SUM(CASE WHEN (items->'answer'->0)::jsonb ? 'valueDeclined' THEN 1 END) AS declinedresponses,
               SUM(CASE WHEN (items->>'id'='Symptoms' AND json_array_length(items->'answer') >= 2) THEN 1 END) AS eligible
        FROM visits v, json_array_elements(v.visit->'responses'->0->'item') items
        WHERE ${dateClause} AND ${demoClause}
        GROUP BY grouping) t2
      ON (t1.grouping = t2.grouping)
      LEFT JOIN (
        SELECT grouping,
               COUNT(*) AS giftcards
        FROM (
          SELECT DISTINCT TRIM(COALESCE(visit->>'${byField}','')) AS grouping,
                 csruid,
                 json_array_elements(visit->'giftcards')->>'code' AS code
          FROM visits
          WHERE ${dateClause} AND ${demoClause}
        ) sub
        GROUP BY grouping) t3
      ON (t1.grouping = t3.grouping)
    ) SELECT * FROM t UNION ALL
      SELECT 'Total',
             SUM(formstarts),
             SUM(eligible),
             SUM(consented),
             SUM(completed),
             SUM(specimenscanned),
             SUM(giftcards),
             SUM(adverseevents),
             SUM(questionsanswered),
             SUM(declinedresponses)
      FROM t;`;
  }
  const surveyStatsData = await clientQuery(getSurveyStatsQuery("location"));

  const surveyStatsByAdminData = await clientQuery(
    getSurveyStatsQuery("administrator")
  );

  const lastQuestionQuery = `
    SELECT visit->'responses'->0->'item'->(json_array_length(visit->'responses'->0->'item')-1)->>'id' AS lastquestion,
           MODE() WITHIN GROUP (ORDER BY visit->'responses'->0->'item'->(json_array_length(visit->'responses'->0->'item')-1)->>'text') AS lastquestiontext,
           COUNT(*),
           ROUND(COUNT(*)*100 / CAST( SUM(COUNT(*)) OVER () AS FLOAT)::NUMERIC, 1) AS percent
    FROM visits
    WHERE ${dateClause} AND ${demoClause} AND json_array_length(visit->'responses'->0->'item') > 0
    GROUP BY lastquestion
    ORDER BY percent DESC;`;
  const lastQuestionData = filterLastQuestionData(
    await clientQuery(lastQuestionQuery)
  );

  const studyIdQuery = `
    SELECT t1.*, t2.giftcardcode, t2.giftcardtype FROM (
    SELECT id AS dbid,
           visit->>'location' AS location,
           device->>'deviceName' AS devicename,
           "createdAt" AS createdat,
           visit->'consents'->0->>'date' AS consentdate,
           (CASE WHEN visit->'samples'->0->>'sample_type' = 'manualBarcodeEntry'
             THEN CONCAT (visit->'samples'->0->>'code', '*')
             ELSE visit->'samples'->0->>'code' END) AS specimencode,
           csruid AS studyid,
           TRIM(visit->>'administrator') AS administrator,
           COALESCE(visit->'events'->0->>'at', '') AS appstarttime,
           visit->'events' AS events
    FROM visits
    WHERE ${dateClause} AND ${demoClause}) t1
    LEFT JOIN (
      SELECT
        csruid AS studyid,
        string_agg(code, ',') AS giftcardcode,
        string_agg(type, ',') AS giftcardtype
      FROM (
        SELECT DISTINCT
          csruid,
          (CASE WHEN barcodeType = 'manualGiftCardEntry' THEN CONCAT(code, '*') ELSE code END) AS code,
          type
        FROM (
          SELECT
            csruid,
            json_array_elements(visit->'giftcards')->>'code' AS code,
            json_array_elements(visit->'giftcards')->>'barcodeType' AS barcodeType,
            json_array_elements(visit->'giftcards')->>'giftcardType' AS type
          FROM visits
          WHERE ${dateClause} AND ${demoClause}
        ) innermost
      ) sub
      GROUP BY studyid
    ) t2
    ON t1.studyid = t2.studyid
    ORDER BY t1.location, t1.appstarttime, t1.createdat;`;
  const studyIdData = (await clientQuery(studyIdQuery)).map(study => ({
    ...study,
    studyid: study.studyid.substring(0, 21)
  }));

  const feedbackQuery = `
    SELECT COUNT(*)
    FROM feedback
    WHERE ${dateClause};`;
  const feedbackData = await clientQuery(feedbackQuery);

  return {
    surveyStatsData,
    surveyStatsByAdminData,
    lastQuestionData,
    studyIdData,
    feedbackData
  };
}

export interface SnifflesDataSummary {
  ageData: object;
  symptomsData: object;
  zipcodeData: object;
}

export async function getDataSummary(
  startDate: string,
  endDate: string
): Promise<SnifflesDataSummary> {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;
  const demoClause =
    "(visit->'isDemo' IS NULL OR (visit->>'isDemo')::boolean IS FALSE)";

  const piiClient = new Client();
  const piiConString = process.env.PII_DATABASE_URL;
  piiClient.connectSync(piiConString);

  const ageQuery = `
    SELECT json_extract_path_text(items, 'answerOptions', answers->>'valueIndex', 'id') AS bucket,
           COUNT(*) AS n
    FROM visits v,
         json_array_elements(v.visit->'responses'->0->'item') items,
         json_array_elements(items->'answer') answers
    WHERE ${dateClause} AND ${demoClause} AND items->>'id'='AgeBucket'
    GROUP BY bucket
    ORDER BY n DESC, bucket;`;
  const ageData = await clientQuery(ageQuery);

  const symptomsQuery = `
    SELECT json_extract_path_text(items, 'answerOptions', answers->>'valueIndex', 'id') AS symptom,
           COUNT(*) AS n
    FROM visits v,
         json_array_elements(v.visit->'responses'->0->'item') items,
         json_array_elements(items->'answer') answers
    WHERE ${dateClause} AND ${demoClause} AND items->>'id'='Symptoms'
    GROUP BY symptom
    ORDER BY n DESC, symptom;`;
  const symptomsData = await clientQuery(symptomsQuery);

  const zipcodeQuery = `
    SELECT addresses->>'postalCode' AS zipcode,
           COUNT(*) AS n
    FROM visits v,
         json_array_elements(v.visit->'patient'->'address') addresses
    WHERE ${dateClause} AND ${demoClause}
    GROUP BY zipcode
    ORDER BY n DESC, zipcode;`;
  const zipcodeData = await piiClient.query(zipcodeQuery);

  return {ageData, symptomsData, zipcodeData};
}

function filterLastQuestionData(lastQuestionData): object {
  let lastQuestionFiltered = [];
  let completedCount: number = 0;
  let completedPercent: number = 0.0;
  for (let row of lastQuestionData) {
    if (
      row.lastquestion === "MedicalInsurance" ||
      row.lastquestion === "WereThereAdverse" ||
      row.lastquestion === "WhichProcedures" ||
      row.lastquestion === "NasalSwabEvents" ||
      row.lastquestion === "BloodDrawEvents"
    ) {
      completedCount += +row.count;
      completedPercent += +row.percent;
    } else {
      lastQuestionFiltered.push(row);
    }
  }
  lastQuestionFiltered.push({
    lastquestion: "(Completed Survey)",
    count: completedCount,
    percent: (Math.round(completedPercent * 10) / 10).toFixed(1),
    lastquestiontext: ""
  });
  return lastQuestionFiltered;
}

export async function getExcelReport(startDate: string, endDate: string) {
  const {
    surveyStatsData,
    surveyStatsByAdminData,
    lastQuestionData,
    studyIdData,
    feedbackData
  } = await getMetrics(startDate, endDate);

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
    grouping: {
      displayName: "Location",
      headerStyle: styles.columnHeader,
      width: 150
    },
    formstarts: {
      displayName: "Started",
      ...defaultCell
    },
    eligible: {
      displayName: "Eligible",
      ...defaultCell
    },
    consented: {
      displayName: "Consented",
      ...defaultCell
    },
    completed: {
      displayName: "Completed",
      ...defaultCell
    },
    specimenscanned: {
      displayName: "Specimen Scanned",
      ...defaultCell
    },
    giftcards: {
      displayName: "Gift Cards",
      ...defaultCell
    },
    adverseevents: {
      displayName: "Adverse Events",
      ...defaultCell
    },
    questionsanswered: {
      displayName: "Total Responses",
      ...defaultCell
    },
    declinedresponses: {
      displayName: "PNTS Responses",
      ...defaultCell
    }
  };

  const lastQuestionSpec = {
    lastquestion: {
      displayName: "Question Key",
      headerStyle: styles.columnHeader,
      width: 120
    },
    count: {
      displayName: "Count",
      ...defaultCell
    },
    percent: {
      displayName: "%",
      ...defaultCell
    },
    lastquestiontext: {
      displayName: "Sample Text",
      headerStyle: styles.columnHeader,
      width: 300
    }
  };

  const surveyStatsByAdminSpec = {
    grouping: {
      displayName: "Administrator",
      headerStyle: styles.columnHeader,
      width: 150
    },
    formstarts: {
      displayName: "Started",
      ...defaultCell
    },
    eligible: {
      displayName: "Eligible",
      ...defaultCell
    },
    consented: {
      displayName: "Consented",
      ...defaultCell
    },
    completed: {
      displayName: "Completed",
      ...defaultCell
    },
    specimenscanned: {
      displayName: "Specimen Scanned",
      ...defaultCell
    },
    giftcards: {
      displayName: "Gift Cards",
      ...defaultCell
    },
    adverseevents: {
      displayName: "Adverse Events",
      ...defaultCell
    }
  };

  const studyIdSpec = {
    location: {
      displayName: "Location",
      headerStyle: styles.columnHeader,
      width: 150
    },
    appstarttime: {
      displayName: "App Start Time (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value, row) {
        return !!value ? toStudyDateString(value) : value;
      },
      width: 150
    },
    devicename: {
      displayName: "iPad Name",
      headerStyle: styles.columnHeader,
      width: 100
    },
    administrator: {
      displayName: "Administrator",
      headerStyle: styles.columnHeader,
      width: 100
    },
    consentdate: {
      displayName: "Consent Date",
      headerStyle: styles.columnHeader,
      width: 100
    },
    giftcardcode: {
      displayName: "Giftcard Code",
      headerStyle: styles.columnHeader,
      width: 150
    },
    giftcardtype: {
      displayName: "Giftcard Type",
      headerStyle: styles.columnHeader,
      width: 80
    },
    specimencode: {
      displayName: "Specimen Code",
      headerStyle: styles.columnHeader,
      width: 80
    },
    createdat: {
      displayName: "Data Received (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value, row) {
        return toStudyDateString(value);
      },
      width: 150
    },
    studyid: {
      displayName: "Study ID",
      headerStyle: styles.columnHeader,
      width: 170
    },
    dbid: {
      displayName: "DB ID",
      ...defaultCell
    },
    events: {
      displayName: "App Event Times (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value: EventInfo[], row) {
        let result = "";
        for (const event of value) {
          result +=
            // omit year to save space
            toStudyDateString(new Date(event.at)).substring(5) +
            " " +
            event.refId +
            ", ";
        }
        return result.length > 0
          ? result.substring(0, result.length - 2)
          : result;
      },
      cellStyle: function(value, row) {
        return styles.small;
      },
      width: 200
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
    [{ value: "SFS Stats by Location", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const surveyStatsByAdminHeading = [
    [{ value: "SFS Stats by Administrator", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const lastQuestionHeading = [
    [{ value: "Last Question on Screen", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const studyIdHeading = [
    [{ value: "Study IDs, Barcodes, Timestamps, etc.", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading],
    [
      {
        value: "Sorted by Location, then App Start Time.",
        style: styles.default
      }
    ]
  ];
  const helpHeading = [
    [{ value: "Explanation of Metrics Columns", style: styles.title }],
    ['"By Location/Administrator" sheet columns'],
    [
      "Started",
      null,
      "How many started, i.e. clicked Get Started from Welcome page"
    ],
    [
      "Eligible",
      null,
      "How many eligible to participate (reported >= 2 symptoms)"
    ],
    ["Consented", null, "How many signed at least one consent form"],
    [
      "Completed",
      null,
      "How many completed the questionnaire, i.e. got to the MedicalInsurance q"
    ],
    ["Specimen Scanned", null, "How many had a specimen scanned"],
    [
      "Gift Cards",
      null,
      "How many gift cards were scanned, not counting duplicate code for same person"
    ],
    ["Adverse Events", null, "How many had adverse events recorded"],
    ["Total Responses", null, "Total number of questions answered"],
    [
      "PNTS Responses",
      null,
      'Number of questions answered "Prefer Not To Say"'
    ],
    [""],
    ['"Details" sheet columns'],
    [
      "App Start Time",
      null,
      "Time on iPad of clicking Get Started from Welcome page"
    ],
    ["iPad Name", null, "Name of iPad set in iPad Settings"],
    ["Administrator", null, 'Name of study administrator aka "clinician"'],
    [
      "Consent Date",
      null,
      "Date on iPad when the user signed the consent form"
    ],
    ["Giftcard Code", null, "Gift card barcode; * means manually entered"],
    ["Giftcard Type", null, "Amazon, Target, etc."],
    ["Specimen Code", null, "Specimen barcode; * means manually entered"],
    [
      "Data Received",
      null,
      "Time on server when it started to receive this survey's data"
    ],
    [
      "Study ID",
      null,
      "Unique ID for associating this survey with other specimens (longitudinal usage)"
    ],
    ["DB ID", null, "Internal ID for Audere use"],
    ["App Event Times", null, "Timestamps for app events"],
    [
      null,
      null,
      "  StartedForm: When the user clicked Get Started from Welcome page"
    ],
    [
      null,
      null,
      '  Enrolled: When the "You are now enrolled in the Seattle Flu Study. Please'
    ],
    [null, null, '     answer the following questions..." screen appeared'],
    [
      null,
      null,
      '  CompletedQuestionnaire: When the "Questionnaire Complete!" screen appeared'
    ],
    [null, null, "  SpecimenScanned: When a specimen barcode was saved"],
    [null, null, "  GiftcardScanned: When a gift card barcode was saved"],
    [
      null,
      null,
      "  CompletedForm: When this record became internally marked as final, closed to updates"
    ]
  ];

  const merges = [
    { start: { row: 1, column: 1 }, end: { row: 1, column: 9 } },
    { start: { row: 2, column: 1 }, end: { row: 2, column: 9 } },
    { start: { row: 3, column: 1 }, end: { row: 3, column: 9 } }
  ];
  const helpMerges = [
    { start: { row: 1, column: 1 }, end: { row: 1, column: 13 } },
    { start: { row: 2, column: 1 }, end: { row: 2, column: 13 } }
  ];

  const report = excel.buildExport([
    {
      name: "By Location",
      merges: merges,
      heading: surveyStatsHeading,
      specification: surveyStatsSpec,
      data: surveyStatsData
    },
    {
      name: "By Administrator",
      merges: merges,
      heading: surveyStatsByAdminHeading,
      specification: surveyStatsByAdminSpec,
      data: surveyStatsByAdminData
    },
    {
      name: "Last Question",
      merges: merges,
      heading: lastQuestionHeading,
      specification: lastQuestionSpec,
      data: lastQuestionData
    },
    {
      name: "Details",
      merges: merges,
      heading: studyIdHeading,
      specification: studyIdSpec,
      data: studyIdData
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

export async function getExcelDataSummary(startDate: string, endDate: string) {
  const {ageData, symptomsData, zipcodeData} = await getDataSummary(
    startDate,
    endDate
  );

  const styles = {
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

  const ageSpec = {
    bucket: {
      displayName: "Age Bucket",
      headerStyle: styles.columnHeader,
      width: 100
    },
    n: {
      displayName: "Count",
      ...defaultCell
    }
  };

  const symptomsSpec = {
    symptom: {
      displayName: "Symptom",
      headerStyle: styles.columnHeader,
      width: 180
    },
    n: {
      displayName: "Count",
      ...defaultCell
    }
  };

  const zipcodeSpec = {
    zipcode: {
      displayName: "Zip code",
      headerStyle: styles.columnHeader,
      width: 70
    },
    n: {
      displayName: "Count",
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
  const ageHeading = [
    [{ value: "Age Distribution", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const symptomsHeading = [
    [{ value: "Symptoms Distribution", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const zipcodeHeading = [
    [
      {
        value: "Zip Code Distribution (home + work addresses)",
        style: styles.title
      }
    ],
    [dateRangeHeading],
    [generatedHeading]
  ];

  const merges = [
    { start: { row: 1, column: 1 }, end: { row: 1, column: 7 } },
    { start: { row: 2, column: 1 }, end: { row: 2, column: 7 } }
  ];

  const report = excel.buildExport([
    {
      name: "Age",
      merges: merges,
      heading: ageHeading,
      specification: ageSpec,
      data: ageData
    },
    {
      name: "Symptoms",
      merges: merges,
      heading: symptomsHeading,
      specification: symptomsSpec,
      data: symptomsData
    },
    {
      name: "Zip Codes",
      merges: merges,
      heading: zipcodeHeading,
      specification: zipcodeSpec,
      data: zipcodeData
    }
  ]);

  return report;
}

export interface FeverMetrics {
  surveyStatsData: object;
  lastScreenData: object;
  statesData: object;
  studyIdData: object;
}

export async function getFeverMetrics(
  startDate: string,
  endDate: string
): Promise<FeverMetrics> {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;
  const demoClause = "((survey->>'isDemo')::boolean IS FALSE)";

  //Get all non-demo mode data out of nonpii database for specified date range
  const feverModels = defineFeverModels(sql);
  const rowsNonPii = await feverModels.surveyNonPii.findAll({
    where: {
      survey: {
        isDemo: false
      },
      createdAt: {
        [Op.between]: [
          new Date(`${startDate} 00:00:00.000${offset}`),
          new Date(`${endDate} 00:00:00.000${offset}`)
        ]
      }
    },
    raw: true
  });

  //Aggregate by age
  const validNonPii = rowsNonPii.filter(row => row.survey.responses[0].item[0] != null);
  const getAge = (row) => {
    const age = row.survey.responses[0].item[0].answer[0].valueIndex;
    return row.survey.responses[0].item[0].answerOptions[age].text;
  };
  const isEligible = (row) => {
    const hasSymptoms = row.survey.events.some(item => 
      item.refId == "PreConsent" || item.refId == "Consent");
    return hasSymptoms ? 1 : 0;
  };
  const didConsent = (row) => row.survey.consents.length > 0 ? 1 : 0;
  const orderedKit = (row) => row.survey.workflow.screeningCompletedAt ? 1 : 0;
  const startedPart2 = (row) => {
    const part2 = row.survey.events.some(item => item.refId == "WelcomeBack");
    return part2 ? 1 : 0;
  };
  const scannedBarcode = (row) => row.survey.samples.length > 0 ? 1 : 0;
  const completedSurvey = (row) => {
    const survey = row.survey.events.some(item => item.refId == "ThankYouSurvey");
    return survey ? 1 : 0;
  };
  const completedTest1 = (row) => {
    const test1 = row.survey.events.some(item => item.refId == "FirstTestFeedback");
    return test1 ? 1 : 0;
  };
  const completedTest2 = (row) => {
    const test2 = row.survey.events.some(item => item.refId == "SecondTestFeedback");
    return test2 ? 1 : 0;
  };
  const finishedApp = (row) => row.survey.workflow.surveyCompletedAt ? 1 : 0;
  const test1Errors = (row) => {
    const error = row.survey.responses[0].item.some(item => 
      item.id == "FirstTestFeedback" && item.answer.length > 0 && item.answer[0].valueIndex >= 2)
    return error ? 1 : 0
  };
  const test2Errors = (row) => {
    const error = row.survey.responses[0].item.some(item => 
      item.id == "SecondTestFeedback" && item.answer.length > 0 && item.answer[0].valueIndex >= 2)
    return error ? 1 : 0
  };
  const ageCounts = aggregate(
    validNonPii,
    getAge,
    (row) => ({ age: getAge(row), 
      count: 0, 
      eligible: 0,
      consents: 0,
      kits: 0,
      part2: 0,
      scanned: 0,
      surveyscompleted: 0,
      test1: 0,
      test2: 0,
      finished: 0,
      kitsreturned: "",
      test1errors: 0,
      test2errors: 0
     }),
    (acc, row) => ({ ...acc, 
      count: acc.count + 1, 
      eligible: acc.eligible + isEligible(row),
      consents: acc.consents + didConsent(row),
      kits: acc.kits + orderedKit(row),
      part2: acc.part2 + startedPart2(row),
      scanned: acc.scanned + scannedBarcode(row),
      surveyscompleted: acc.surveyscompleted + completedSurvey(row),
      test1: acc.test1 + completedTest1(row),
      test2: acc.test2 + completedTest2(row),
      finished: acc.finished + finishedApp(row),
      test1errors: acc.test1errors + test1Errors(row),
      test2errors: acc.test2errors + test2Errors(row)
    })
  );
  let ageData = ageCounts.sort((a, b) => a.age.localeCompare(b.age));
  if (ageData.length > 0) {
    const total = ageData.reduce( (previousValue, currentValue) => {
      return {
        age: "Total",
        count: previousValue.count + currentValue.count,
        eligible: previousValue.eligible + currentValue.eligible,
        consents: previousValue.consents + currentValue.consents,
        kits: previousValue.kits + currentValue.kits,
        part2: previousValue.part2 + currentValue.part2,
        scanned: previousValue.scanned + currentValue.scanned,
        surveyscompleted: previousValue.surveyscompleted + currentValue.surveyscompleted,
        test1: previousValue.test1 + currentValue.test1,
        test2: previousValue.test2 + currentValue.test2,
        finished: previousValue.finished + currentValue.finished,
        kitsreturned: "",
        test1errors: previousValue.test1errors + currentValue.test1errors,
        test2errors: previousValue.test2errors + currentValue.test2errors
      }
    });
    ageData.push(total);
  }
  const surveyStatsData = funnelAgeData(ageData);
  
  //Get all non-demo mode data out of pii database for specified date range
  const rowsPii = await feverModels.surveyPii.findAll({
    where: {
      survey: {
        isDemo: false
      },
      createdAt: {
        [Op.between]: [
          new Date(`${startDate} 00:00:00.000${offset}`),
          new Date(`${endDate} 23:59:59.999${offset}`)
        ]
      }
    },
    raw: true
  });
  
  //Aggregate data by U. S. State
  const validPii = rowsPii.filter(row => row.survey.patient.address[0] != null);
  const getState = (row) => row.survey.patient.address[0].state;
  const counts = aggregate(
    validPii,
    getState,
    (row) => ({ state: getState(row), count: 0 }),
    (acc, row) => ({ ...acc, count: acc.count + 1 })
  );
  const statesData = counts
    .sort((a, b) => b.count - a.count)
    .map(x => ({
      ...x,
      percent: (x.count / validPii.length * 100).toFixed(1)
    }));

  //Aggregate data by last screen viewed
  const rowsUnfinishedSurveys = rowsPii
    .filter(row => row.survey.events != null)
    .filter(row => !('surveyCompletedAt' in row.survey.workflow));
  const getLastScreen = (row) => row.survey.events[row.survey.events.length - 1].refId;
  const screenCounts = aggregate(
    rowsUnfinishedSurveys,
    getLastScreen,
    (row) => ({ lastscreen: getLastScreen(row), count: 0}),
    (acc, row) => ({ ...acc, count: acc.count + 1})
  );

  const lastScreenData = filterLastScreenData(screenCounts
    .sort((a, b) => b.count - a.count)
    .map(x => ({
      ...x,
      percent: (x.count / rowsUnfinishedSurveys.length * 100).toFixed(1),
    })));

  const studyIdQuery = `
    WITH t AS (SELECT DISTINCT ON (fcs.id) fcs.id,
      (SELECT events->>'at' as kitordertime
        FROM json_array_elements(survey->'events') events
        WHERE ${dateClause} AND ${demoClause} AND events->>'refId'='Confirmation' LIMIT 1),
      (SELECT events->>'at' as part2time
        FROM json_array_elements(survey->'events') events
        WHERE ${dateClause} AND ${demoClause} AND events->>'refId'='WelcomeBack' LIMIT 1),
      (SELECT events->>'at' as questionscompletedtime
        FROM json_array_elements(survey->'events') events
        WHERE ${dateClause} AND ${demoClause} AND events->>'refId'='ThankYouSurvey' LIMIT 1),
      (SELECT json_extract_path(items->'answerOptions',
        items->'answer'->0->>'valueIndex','id') as firsttestfeedback
        FROM json_array_elements(survey->'responses'->0->'item') items
        WHERE ${dateClause} AND ${demoClause} AND items->>'id'='FirstTestFeedback'),
      (SELECT json_extract_path(items->'answerOptions',
        items->'answer'->0->>'valueIndex','id') as secondtestfeedback
        FROM json_array_elements(survey->'responses'->0->'item') items
        WHERE ${dateClause} AND ${demoClause} AND items->>'id'='SecondTestFeedback'),
      (SELECT json_extract_path(items->'answerOptions',
        items->'answer'->0->>'valueIndex','id') as redwhenblue
        FROM json_array_elements(survey->'responses'->0->'item') items
        WHERE ${dateClause} AND ${demoClause} AND items->>'id'='RedWhenBlue')
      FROM fever_current_surveys fcs
      WHERE ${dateClause} AND ${demoClause}
      ORDER BY fcs.id, kitordertime ASC)
    SELECT
          t.kitordertime,
          t.part2time,
          t.questionscompletedtime,
          t.firsttestfeedback,
          t.secondtestfeedback,
          t.redwhenblue,
          fcs.id as dbid,
          fcs."createdAt",
          CASE WHEN fcs.survey->'samples'->0->>'sample_type' = 'manualEntry'
              THEN CONCAT(fcs.survey->'samples'->0->>'code','*')
              ELSE fcs.survey->'samples'->0->>'code' END as barcode,
          fcs.survey->'workflow'->'surveyCompletedAt' as finishtime,
          fcs.csruid as studyid,
          fcs.device->'clientVersion'->'version' as appversion,
          regexp_matches(fcs.device->>'platform','"model":"(.*)","user') as devicemodel,
          fcs.device->'installation' as installation,
          CASE WHEN (fcs.survey->'workflow')::jsonb ? 'surveyCompletedAt' THEN 'Finisehd App'
              WHEN (fcs.survey->'workflow')::jsonb ? 'surveyStartedAt' THEN 'Scanned Barcode'
              WHEN (fcs.survey->'workflow')::jsonb ? 'screeningCompletedAt' THEN 'Ordered Kit'
              ELSE ''
              END as workflow,
          json_extract_path_text(survey->'responses'->0->'item'->0->'answerOptions',
            survey->'responses'->0->'item'->0->'answer'->0->>'valueIndex','text') as age
      FROM t RIGHT JOIN fever_current_surveys fcs
    ON fcs.id=t.id
    WHERE ${dateClause} AND ${demoClause}
    ORDER BY fcs."createdAt";`;

  const studyIdData = (await clientQuery(studyIdQuery)).map(study => ({
    ...study,
    studyid: study.studyid.substring(0, 21)
  }));

  return {surveyStatsData, lastScreenData, statesData, studyIdData};
}

function aggregate<Row, Key, Value>(
  items: Row[],
  keyOf: (row: Row) => Key,
  zero: (row: Row) => Value,
  bind: (acc: Value, row: Row) => Value
): Value[] {
  const map = new Map<Key, Value>();
  items.forEach(row => {
    const key = keyOf(row);
    const current = map.has(key) ? map.get(key) : zero(row);
    const updated = bind(current, row);
    map.set(key, updated);
  });
  return [...map.values()];
}

function funnelAgeData(ageData): object {
  const totalRow = ageData[ageData.length - 1];
  if (totalRow){
    ageData.push({
      "age": "% of users",
      "count": "100%",
      "eligible": (totalRow.eligible/totalRow.count * 100).toFixed(1) + "%",
      "consents": (totalRow.consents/totalRow.count * 100).toFixed(1) + "%",
      "kits": (totalRow.kits/totalRow.count * 100).toFixed(1) + "%",
      "part2": (totalRow.part2/totalRow.count * 100).toFixed(1) + "%",
      "scanned": (totalRow.scanned/totalRow.count * 100).toFixed(1) + "%",
      "surveyscompleted": (totalRow.surveyscompleted/totalRow.count * 100).toFixed(1) + "%",
      "test1": (totalRow.test1/totalRow.count * 100).toFixed(1) + "%",
      "test2": (totalRow.test2/totalRow.count * 100).toFixed(1) + "%",
      "finished": (totalRow.finished/totalRow.count * 100).toFixed(1) + "%",
      "kitsreturned": "",
      "test1errors": (totalRow.test1errors/totalRow.count * 100).toFixed(1) + "%",
      "test2errors": (totalRow.test2errors/totalRow.count * 100).toFixed(1) + "%",
    });
    ageData.push({
      "age": "% retention",
      "count": "",
      "eligible": (totalRow.eligible/totalRow.count * 100).toFixed(1) + "%",
      "consents": (totalRow.consents/totalRow.eligible * 100).toFixed(1) + "%",
      "kits": (totalRow.kits/totalRow.consents * 100).toFixed(1) + "%",
      "part2": (totalRow.part2/totalRow.kits * 100).toFixed(1) + "%",
      "scanned": (totalRow.scanned/totalRow.part2 * 100).toFixed(1) + "%",
      "surveyscompleted": (totalRow.surveyscompleted/totalRow.scanned * 100).toFixed(1) + "%",
      "test1": (totalRow.test1/totalRow.surveyscompleted * 100).toFixed(1) + "%",
      "test2": (totalRow.test2/totalRow.test1 * 100).toFixed(1) + "%",
      "finished": (totalRow.finished/totalRow.test2 * 100).toFixed(1) + "%",
      "kitsreturned": "",
      "test1errors": "",
      "test2errors": ""
    });
  }

  return ageData;
}

function filterLastScreenData(lastScreenData): object {
  let lastScreenFiltered = [];
  const screenDetails = {
    "Welcome": "Beginning of app (Part 1 - Screen 1)",
    "Why": "Why this study? (Part 1 - Screen 2)",
    "What": "Getting started (Part 1 - Screen 3)",
    "Age": "How old are you? (Part 1 - Screen 4)",
    "AgeIneligible": "Thanks for your interest (Part 1)",
    "Symptoms": "Describe your symptoms (Part 1 - Screen 5)",
    "SymptomsIneligible": "Thanks for your interest (Part 1)",
    "Consent": "Consent form (Part 1 - Screen 6)",
    "ConsentIneligible": "Thanks for your interest (Part 1)",
    "Address": "Email and Address (Part 1 - Screen 7)",
    "Confirmation": "Thank you! Your flu test kit has been ordered. (Part 1 - Screen 8)",
    "WelcomeBack": "Welcome back (Part 2 - Screen 1)",
    "WhatsNext": "What's next? (Part 2 - Screen 2)",
    "ScanInstructions": "Scan the barcode (Part 2 - Screen 3)",
    "Scan": "Camera for scanning barcode (Part 2 - Screen 4)",
    "ScanConfirmation": "Your code was scanned! (Part 2 - Screen 5)",
    "ManualEntry": "Enter barcode manually (Part 2 - Screen 4)",
    "ManualConfirmation": "Your code was accepted (Part 2 - Screen 5)",
    "Unpacking": "How the test works (Part 2 - Screen 6)",
    "Swab": "Begin the first test (Part 2 - Screen 7)",
    "SwabPrep": "Prepare tube (Part 2 - Screen 8)",
    "OpenSwab": "Open nasal swab (Part 2 - Screen 9)",
    "Mucus": "Collect sample from nose (Part 2 - Screen 10)",
    "SwabInTube": "Put swab in tube (Part 2 - Screen 11)",
    "FirstTimer": "Did you know? (Part 2 - Screen 12)",
    "RemoveSwabFromTube": "Remove swab from tube (Part 2 - Screen 13)",
    "OpenTestStrip": "Open test strip (Part 2 - Screen 14)",
    "StripInTube": "Put test strip in tube (Part 2 - Screen 15)",
    "WhatSymptoms": "Symptom Survey (Part 2 - Screen 16)",
    "WhenSymptoms": "Symptom Survey (Part 2 - Screen 17)",
    "GeneralExposure": "General Exposure (Part 2 - Screen 18)",
    "GeneralHealth": "General Health (Part 2 - Screen 19)",
    "ThankYouSurvey": "Thank you! (Part 2 - Screen 20)",
    "TestStripReady": "Remove test strip (Part 2 - Screen 21)",
    "FinishTube": "Finish with the tube (Part 2 - Screen 22)",
    "LookAtStrip": "Look at the test strip (Part 2 - Screen 23)",
    "TestStripSurvey": "What do you see? (Part 2 - Screen 24)",
    "PictureInstructions": "Take a photo of the strip (Part 2 - Screen 25)",
    "TestStripCamera": "Camera for test strip (Part 2 - Screen 26)",
    "TestStripConfirmation": "Photo captured! (Part 2 - Screen 27)",
    "CleanFirstTest": "Clean up the first test (Part 2 - Screen 28)",
    "FirstTestFeedBack": "Nice job with the first test! (Part 2 - Screen 29)",
    "BeginSecondTest": "Begin the second test (Part 2 - Screen 30)",
    "PrepSecondTest": "Prepare for the test (Part 2 - Screen 31)",
    "MucusSecond": "Collect sample from nose (Part 2 - Screen 32)",
    "SwabInTubeSecond": "Put swab in tube (Part 2 - Screen 33)",
    "CleanSecondTest": "Clean up the second test (Part 2 - Screen 34)",
    "SecondTestFeedback": "Nice job with the second test! (Part 2 - Screen 35)",
    "Packing": "Packing things up (Part 2 - Screen 36)",
    "Stickers": "Put stickers on the box (Part 2 - Screen 37)",
    "SecondBag": "Put bag 2 in the box (Part 2 - Screen 38)",
    "TapeBox": "Tape up the box (Part 2 - Screen 39)",
    "ShipBox": "Shipping your box (Part 2 - Screen 40)",
    "SchedulePickup": "Schedule a pickup (Part 2 - Screen 41)",
    "EmailOptIn": "Opt-in for messages (Part 2 - Screen 42)",
    "About": "About the Study (Menu)",
    "Funding": "Study Funding (Menu)",
    "Partners": "Partners (Menu)",
    "GeneralQuestions": "GeneralQuestions (Menu)",
    "Problems": "Problems With the App (Menu)",
    "TestQuestions": "Test Questions (Menu)",
    "GiftcardQuestions": "Gift Card Questions (Menu)",
    "ContactSupport": "ContactSupport (Menu)",
    "Version": "App Version (Menu)"
  };
  for (let row of lastScreenData) {
      if (screenDetails[row.lastscreen]){
        const detail = screenDetails[row.lastscreen];
        const rowWithDetails = { ...row, detail};
        lastScreenFiltered.push(rowWithDetails);
      }
      else{
        lastScreenFiltered.push(row);
      }

  }
  return lastScreenFiltered;
}

export async function getFeverExcelReport(startDate: string, endDate: string) {
  const {surveyStatsData, lastScreenData, statesData, studyIdData} = await getFeverMetrics(
    startDate,
    endDate
  );

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
    width: 100,
    cellStyle: function(value, row) {
      return { alignment: { horizontal: "right" } };
    }
  };
  const surveyStatsSpec = {
    age: {
      displayName: "Age",
      ...defaultCell
    },
    count: {
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
      displayName: "Began Part 2",
      ...defaultCell
    },
    scanned: {
      displayName: "Barcode Scanned",
      ...defaultCell
    },
    surveyscompleted: {
      displayName: "Completed Survey",
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
    finished: {
      displayName: "Finished App",
      ...defaultCell
    },
    kitsreturned: {
      displayName: "Kits Returned",
      ...defaultCell
    },
    test1errors: {
      displayName: "Test 1 Errors",
      ...defaultCell
    },
    test2errors: {
      displayName: "Test 2 Errors",
      ...defaultCell
    }
  };

  const lastScreenSpec = {
    lastscreen: {
      displayName: "Screen Key",
      headerStyle: styles.columnHeader,
      width: 120
    },
    count: {
      displayName: "Count",
      ...defaultCell
    },
    percent: {
      displayName: "%",
      ...defaultCell
    },
    detail: {
      displayName: "Detail",
      headerStyle: styles.columnHeader,
      width: 400
    }
  };

  const statesSpec = {
    state: {
      displayName: "State",
      headerStyle: styles.columnHeader,
      width: 120
    },
    count: {
      displayName: "Count",
      ...defaultCell
    },
    percent: {
      displayName: "%",
      ...defaultCell
    }
  };

  const studyIdSpec = {
    age: {
      displayName: "Age",
      headerStyle: styles.columnHeader,
      width: 70
    },
    createdAt: {
      displayName: "App Start Time (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value, row) {
        return !!value ? toStudyDateString(value) : value;
      },
      width: 150
    },
    barcode: {
      displayName: "Barcode",
      headerStyle: styles.columnHeader,
      width: 100
    },
    studyid: {
      displayName: "Study ID",
      headerStyle: styles.columnHeader,
      width: 170
    },
    dbid: {
      displayName: "DB ID",
      headerStyle: styles.columnHeader,
      width: 50
    },
    appversion: {
      displayName: "Version",
      headerStyle: styles.columnHeader,
      width: 50
    },
    devicemodel: {
      displayName: "Device Model",
      ...defaultCell
    },
    installation: {
      displayName: "Installation ID",
      headerStyle: styles.columnHeader,
      width: 300
    },
    kitordertime: {
      displayName: "Kit Ordered (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value, row) {
        return !!value ? toStudyDateString(value) : value;
      },
      width: 150
    },
    part2time: {
      displayName: "Started Part II (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value, row) {
        return !!value ? toStudyDateString(value) : value;
      },
      width: 150
    },
    questionscompletedtime: {
      displayName: "Finished Survey Questions (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value, row) {
        return !!value ? toStudyDateString(value) : value;
      },
      width: 150
    },
    finishtime: {
      displayName: "Finished App (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value, row) {
        return !!value ? toStudyDateString(value) : value;
      },
      width: 150
    },
    firsttestfeedback: {
      displayName: "First Test Feedback",
      headerStyle: styles.columnHeader,
      width: 125
    },
    secondtestfeedback: {
      displayName: "Second Test Feedback",
      headerStyle: styles.columnHeader,
      width: 125
    },
    redwhenblue: {
      displayName: "Red Line Answer",
      headerStyle: styles.columnHeader,
      width: 125
    },
    workflow: {
      displayName: "Status",
      headerStyle: styles.columnHeader,
      width: 125
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
    [{ value: "flu@home Stats by Age", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const lastScreenHeading = [
    [{ value: "Last Screen Viewed for Users Who Did Not Finish the App", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const statesHeading = [
    [{ value: "flu@home Stats by U.S. State", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const studyIdHeading = [
    [{ value: "Study IDs, Barcodes, Timestamps, etc.", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading],
    [
      {
        value: "Sorted by App Start Time.",
        style: styles.default
      }
    ]
  ];
  const helpHeading = [
    [{ value: "Explanation of Metrics Columns", style: styles.title }],
    ["By Age sheet columns"],
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
    [
      "Started Part 2",
      null,
      "How many reopened the app to find Welcome Back screen"
    ],
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
      "Test 1 Errors",
      null,
      "How many said they messed up test 1, thought it was very confusing, or were missing materials"
    ],
    [
      "Test 2 Complete",
      null,
      "How many made it to the survey question at the end of the second test"
    ],
    [
      "Test 2 Errors",
      null,
      "How many said they messed up test 2, thought it was very confusing, or were missing materials"
    ],
    ["Finished", null, "How many made it to the last screen"],
    [],
    ["By Age sheet rows"],
    ["Total", null, "Sum of all users including those who did not report age"],
    ["% of users", null, "The percentage of all users who completed each step"],
    [
      "% retention",
      null,
      "What percent of the users who completed the previous step completed the current step"
    ],
    [],
    ["Last Screen sheet columns"],
    ["ScreenKey", null, "Name of last screen/event recorded"],
    ["Count", null, "How many people stopped at that screen"],
    ["%", null, "Percent of users that stopped on that screen"],
    [
      "Detail",
      null,
      "Sample of the text displayed on that screen and location in the app"
    ],
    [],
    ["U.S. States sheet columns"],
    ["State", null, "US State abbreviation"],
    ["Count", null, "How many people ordered a kit from that state"],
    ["%", null, "Percent of kits that were ordered from that state"],
    [],
    ["Details sheet columns"],
    ["App Start Time", null, "Time user clicked beyond Welcome page"],
    [
      "Barcode",
      null,
      "Barcode that was scanned or manually entered from label on kit (* denotes manual entry)"
    ],
    [
      "Study ID",
      null,
      "Unique ID for associating this survey with other specimens (longitudinal usage)"
    ],
    ["DB ID", null, "Internal ID for Audere use"],
    ["Version", null, "Which version of the app the user used"],
    ["Device Model", null, "What device the user used to complete the app"],
    ["Installation ID", null, "Unique ID associated with App installation"],
    ["Kit Ordered", null, "Time user submitted their address to order kit"],
    ["Started Part II", null, "Time user reopened app to begin part 2"],
    ["Finished Survey Questions", null, "Time when user finished the questions about their illness"],
    ["Finished App", null, "Time user reached last screen of app"],
    [
      "First Test Feedback",
      null,
      "User's choice on first test feedback question"
    ],
    [
      "Second Test Feedback",
      null,
      "User's choice on second test feedback question"
    ],
    [
      "Red When Blue",
      null,
      "User's answer to whether they can see a red line when they already said they saw a blue line"
    ],
    ["Status", null, "Current workflow state of app"]
  ];

  const merges = [
    { start: { row: 1, column: 1 }, end: { row: 1, column: 14 } },
    { start: { row: 2, column: 1 }, end: { row: 2, column: 14 } },
    { start: { row: 3, column: 1 }, end: { row: 3, column: 14 } }
  ];
  const helpMerges = [
    { start: { row: 1, column: 1 }, end: { row: 1, column: 13 } }
  ];

  const report = excel.buildExport([
    {
      name: "By Age",
      merges: merges,
      heading: surveyStatsHeading,
      specification: surveyStatsSpec,
      data: surveyStatsData
    },
    {
      name: "Last Screen",
      merges: merges,
      heading: lastScreenHeading,
      specification: lastScreenSpec,
      data: lastScreenData
    },
    {
      name: "By U.S. States",
      merges: merges,
      heading: statesHeading,
      specification: statesSpec,
      data: statesData
    },
    {
      name: "Details",
      merges: merges,
      heading: studyIdHeading,
      specification: studyIdSpec,
      data: studyIdData
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

export async function getFeverFirebase(
  startDate: string,
  endDate: string
): Promise<[object]> {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const secrets = new SecretConfig(sql);
  const bigqueryConfig = await getBigqueryConfig(secrets);

  const bigquery = new BigQuery({
    projectId: 'flu-at-home-app',
    credentials: JSON.parse(bigqueryConfig.authToken)
  });

  const query = `SELECT COUNT(DISTINCT user_id) count,
    (SELECT value.string_value FROM UNNEST(user_properties) WHERE key="utm_content") as ad
    FROM \`flu-at-home-app.analytics_195485168.events_*\`
    WHERE user_id NOT IN
      (SELECT DISTINCT user_id
      FROM \`flu-at-home-app.analytics_195485168.events_*\`
      WHERE EXISTS (SELECT 1 FROM UNNEST(user_properties) WHERE key="demo_mode_aware")) AND
      EXISTS (SELECT 1 FROM UNNEST(user_properties) WHERE key="install_referrer") AND
      event_date >= ? AND
      event_date <= ?
    GROUP BY ad
    HAVING ad IS NOT NULL
    ORDER by count DESC`;
  const options = {
    query: query,
    location: 'US',
    params: [startDate.replace(/-/g, ""), endDate.replace(/-/g, "")],
  };
  const [job] = await bigquery.createQueryJob(options);
  const [addData] = await job.getQueryResults();
  return [addData];
}
