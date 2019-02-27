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
): [object, object, object, object] {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;
  const demoClause =
    "(visit->>'isDemo')::boolean IS FALSE))";

  function getSurveyStatsQuery(byField: string): string {
    return `
      SELECT COUNT(*) as total, json_array_length(survey->'consents') as consents
      FROM fever_current_surveys;`;
  }
  const surveyStatsData = client.querySync(getSurveyStatsQuery("location"));

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
    FROM fever_current_surveys;`;
  const feedbackData = client.querySync(feedbackQuery);

  return [
    surveyStatsData,
    lastQuestionData,
    studyIdData,
    feedbackData
  ];
}

export function getFeverDataSummary(
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

export function getFeverExcelReport(startDate: string, endDate: string) {
  const [
    surveyStatsData,
    lastQuestionData,
    studyIdData,
    feedbackData
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

export function getFeverExcelDataSummary(startDate: string, endDate: string) {
  const [ageData, symptomsData, zipcodeData] = getFeverDataSummary(
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
