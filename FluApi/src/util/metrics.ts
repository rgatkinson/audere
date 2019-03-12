"use strict";
import { EventInfo } from "audere-lib/snifflesProtocol";
const excel = require("node-excel-export");

const enStrings = require("../../../FluStudy/src/i18n/locales/en.json");
const Client = require("pg-native");
const client = new Client();
const conString = process.env.NONPII_DATABASE_URL;
client.connectSync(conString);

const STUDY_TIMEZONE = "America/Los_Angeles";
const moment = require("moment-timezone");

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

export function getMetrics(
  startDate: string,
  endDate: string
): [object, object, object, object, object] {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;
  const demoClause =
    "(id > 351 and (visit->'isDemo' IS NULL OR (visit->>'isDemo')::boolean IS FALSE))";

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
  const surveyStatsData = client.querySync(getSurveyStatsQuery("location"));

  const surveyStatsByAdminData = client.querySync(
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
    client.querySync(lastQuestionQuery)
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
  const studyIdData = client.querySync(studyIdQuery).map(study => ({
    ...study,
    studyid: study.studyid.substring(0, 21)
  }));

  const feedbackQuery = `
    SELECT COUNT(*) 
    FROM feedback
    WHERE ${dateClause};`;
  const feedbackData = client.querySync(feedbackQuery);

  return [
    surveyStatsData,
    surveyStatsByAdminData,
    lastQuestionData,
    studyIdData,
    feedbackData
  ];
}

export function getDataSummary(
  startDate: string,
  endDate: string
): [object, object, object] {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;
  const demoClause =
    "(id > 351 and (visit->'isDemo' IS NULL OR (visit->>'isDemo')::boolean IS FALSE))";

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
  const ageData = client.querySync(ageQuery);

  const symptomsQuery = `
    SELECT json_extract_path_text(items, 'answerOptions', answers->>'valueIndex', 'id') AS symptom, 
           COUNT(*) AS n 
    FROM visits v, 
         json_array_elements(v.visit->'responses'->0->'item') items, 
         json_array_elements(items->'answer') answers 
    WHERE ${dateClause} AND ${demoClause} AND items->>'id'='Symptoms' 
    GROUP BY symptom 
    ORDER BY n DESC, symptom;`;
  const symptomsData = client.querySync(symptomsQuery);

  const zipcodeQuery = `
    SELECT addresses->>'postalCode' AS zipcode, 
           COUNT(*) AS n
    FROM visits v, 
         json_array_elements(v.visit->'patient'->'address') addresses 
    WHERE ${dateClause} AND ${demoClause} 
    GROUP BY zipcode 
    ORDER BY n DESC, zipcode;`;
  const zipcodeData = piiClient.querySync(zipcodeQuery);

  return [ageData, symptomsData, zipcodeData];
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

export function getExcelReport(startDate: string, endDate: string) {
  const [
    surveyStatsData,
    surveyStatsByAdminData,
    lastQuestionData,
    studyIdData,
    feedbackData
  ] = getMetrics(startDate, endDate);

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

export function getExcelDataSummary(startDate: string, endDate: string) {
  const [ageData, symptomsData, zipcodeData] = getDataSummary(
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

export function getFeverMetrics(
  startDate: string,
  endDate: string
): [object, object, object] {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;
  const demoClause = "((survey->>'isDemo')::boolean IS FALSE)";

  function getSurveyStatsQuery(): string {
    return `
      WITH agebuckets AS (
      WITH t AS (
        WITH t1 AS (
          SELECT json_extract_path_text(survey->'responses'->0->'item'->0->'answerOptions',
              survey->'responses'->0->'item'->0->'answer'->0->>'valueIndex','text') as age,
            SUM(CASE WHEN (items->>'id'='FirstTestFeedback' AND (items->'answer'->0->>'valueIndex')::int >= 2)
              THEN 1 END) test1errors
          FROM fever_current_surveys, json_array_elements(survey->'responses'->0->'item') items
          WHERE ${dateClause} AND ${demoClause}
          GROUP BY age)
        SELECT t1.age, t1.test1errors, t2.test2errors
        FROM t1 LEFT JOIN (
          SELECT json_extract_path_text(survey->'responses'->0->'item'->0->'answerOptions',
              survey->'responses'->0->'item'->0->'answer'->0->>'valueIndex','text') as age,
            SUM(CASE WHEN (items->>'id'='SecondTestFeedback' AND (items->'answer'->0->>'valueIndex')::int >= 2)
              THEN 1 END) test2errors
          FROM fever_current_surveys, json_array_elements(survey->'responses'->0->'item') items
          WHERE ${dateClause} AND ${demoClause}
          GROUP BY age
        ) t2
        ON t1.age=t2.age
      )
      SELECT 
        t.age,
        t.test1errors, 
        t.test2errors, 
        t4.total, 
        t4.eligible, 
        t4.consents,
        t4.kits,
        t4.part2,
        t4.scanned,
        t4.surveyscompleted,
        t4.test1,
        t4.test2,
        t4.finished,
        t4.kitsreturned
       FROM t RIGHT JOIN (
        SELECT
          json_extract_path_text(survey->'responses'->0->'item'->0->'answerOptions',
            survey->'responses'->0->'item'->0->'answer'->0->>'valueIndex','text') as age,
          COUNT(*) as total, 
          SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"Consent"}]' THEN 1 END) as eligible,
          SUM(CASE WHEN survey->'consents'->0->'date' IS NOT NULL THEN 1 END) as consents,
          SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"Confirmation"}]' THEN 1 END) as kits,
          SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"WelcomeBack"}]' THEN 1 END) as part2,
          SUM(CASE WHEN survey->'samples'->0->'code' IS NOT NULL THEN 1 END) as scanned,
          SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"ThankYouSurvey"}]' THEN 1 END) as surveyscompleted,
          SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"FirstTestFeedback"}]' THEN 1 END) as test1,
          SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"SecondTestFeedback"}]' THEN 1 END) as test2,
          SUM(CASE WHEN (survey->'events')::jsonb @> '[{"refId":"Thanks"}]' THEN 1 END) as finished, 
          '' as kitsreturned
          FROM fever_current_surveys fcs
          WHERE ${dateClause} AND ${demoClause}
          GROUP BY age
          ORDER BY age
        ) t4
      ON t.age = t4.age
      ORDER BY age)
      SELECT * FROM agebuckets UNION ALL 
      SELECT 'Total', 
             SUM(test1errors), 
             SUM(test2errors),
             SUM(total),
             SUM(eligible), 
             SUM(consents), 
             SUM(kits), 
             SUM(part2), 
             SUM(scanned), 
             SUM(surveyscompleted), 
             SUM(test1), 
             SUM(test2),
             SUM(finished),
             ''
      FROM agebuckets;`;
  }
  const surveyStatsData = client.querySync(getSurveyStatsQuery());

  const lastScreenQuery = `
    SELECT survey->'events'->(json_array_length(survey->'events')-1)->>'refId' AS lastscreen, 
           COUNT(*), 
           ROUND(COUNT(*)*100 / CAST( SUM(COUNT(*)) OVER () AS FLOAT)::NUMERIC, 1) AS percent 
    FROM fever_current_surveys
    WHERE ${dateClause} AND ${demoClause} AND json_array_length(survey->'events') > 0
    GROUP BY lastscreen 
    ORDER BY percent DESC;`;
  const lastScreenData = filterLastScreenData(
    client.querySync(lastScreenQuery)
  );

  const studyIdQuery = `
    WITH t AS (SELECT DISTINCT ON (fcs.id) fcs.id, 
      (SELECT events->>'at' as kitordertime
        FROM json_array_elements(survey->'events') events
        WHERE ${dateClause} AND ${demoClause} AND events->>'refId'='Confirmation' LIMIT 1),
      (SELECT events->>'at' as part2time
        FROM json_array_elements(survey->'events') events
        WHERE ${dateClause} AND ${demoClause} AND events->>'refId'='WelcomeBack' LIMIT 1),
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
          t.firsttestfeedback,
          t.secondtestfeedback,
          t.redwhenblue,
          fcs.id as dbid, 
          fcs."createdAt", 
          fcs.survey->'samples'->0->'code' as barcode,
          fcs.survey->'workflow'->'surveyCompletedAt' as finishtime,
          fcs.csruid as studyid,
          fcs.device->'clientVersion'->'version' as appversion,
          regexp_matches(fcs.device->>'platform','"model":"(.*)","user') as devicemodel,
          fcs.device->'installation' as installation,
          fcs.survey->>'workflow' as workflow,
          json_extract_path_text(survey->'responses'->0->'item'->0->'answerOptions',
            survey->'responses'->0->'item'->0->'answer'->0->>'valueIndex','text') as age
      FROM t RIGHT JOIN fever_current_surveys fcs
    ON fcs.id=t.id
    WHERE ${dateClause} AND ${demoClause}
    ORDER BY fcs."createdAt";`;

  const studyIdData = client.querySync(studyIdQuery).map(study => ({
    ...study,
    studyid: study.studyid.substring(0, 21)
  }));

  return [surveyStatsData, lastScreenData, studyIdData];
}

function filterLastScreenData(lastScreenData): object {
  let lastScreenFiltered = [];
  let completedCount: number = 0;
  let completedPercent: number = 0.0;
  for (let row of lastScreenData) {
    if (row.lastscreen === "Thanks") {
      completedCount += +row.count;
      completedPercent += +row.percent;
    } else {
      let lastscreenText = "";
      if (!!row.lastscreen) {
        const screenNamespace =
          row.lastscreen.charAt(0).toLowerCase() +
          row.lastscreen.slice(1) +
          "Screen";
        if (!!enStrings[screenNamespace]) {
          lastscreenText = enStrings[screenNamespace].title; // show "title" if exists for this screen
          if (!lastscreenText) {
            // else show the content of the first key for this screen
            lastscreenText =
              enStrings[screenNamespace][
                Object.keys(enStrings[screenNamespace])[0]
              ];
          }
        }
      }
      const rowWithText = { ...row, lastscreenText };
      lastScreenFiltered.push(rowWithText);
    }
  }
  lastScreenFiltered.push({
    lastscreen: "(Finished App)",
    count: completedCount,
    percent: (Math.round(completedPercent * 10) / 10).toFixed(1)
  });
  return lastScreenFiltered;
}

export function getFeverExcelReport(startDate: string, endDate: string) {
  const [surveyStatsData, lastScreenData, studyIdData] = getFeverMetrics(
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
    test1errors: {
      displayName: "Test 1 Errors",
      ...defaultCell
    },
    test2: {
      displayName: "Test 2 Complete",
      ...defaultCell
    },
    test2errors: {
      displayName: "Test 2 Errors",
      ...defaultCell
    },
    finished: {
      displayName: "Finished App",
      ...defaultCell
    },
    kitsreturned: {
      displayName: "Kits Returned",
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
    lastscreenText: {
      displayName: "Screen Text",
      headerStyle: styles.columnHeader,
      width: 300
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
      displayName: "Workflow",
      headerStyle: styles.columnHeader,
      width: 500
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
    [{ value: "Fever Stats by Age", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const lastScreenHeading = [
    [{ value: "Last Screen Viewed", style: styles.title }],
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
    ["Last Screen sheet columns"],
    ["ScreenKey", null, "Name of last screen/event recorded"],
    ["Count", null, "How many people stopped at that screen"],
    ["%", null, "Percent of users that stopped on that screen"],
    ["Screen Text", null, "Sample of the text displayed on that screen"],
    [],
    ["Details sheet columns"],
    ["App Start Time", null, "Time user clicked beyond Welcome page"],
    [
      "Barcode",
      null,
      "Barcode that was scanned or manually entered from label on kit"
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
    ["Workflow", null, "Current workflow state of app"]
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
