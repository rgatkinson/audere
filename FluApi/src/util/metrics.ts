"use strict";

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
): [object, object, object, object, object, object] {
  const datePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  if (!startDate.match(datePattern) || !endDate.match(datePattern)) {
    throw new Error("Dates must be specified as yyyy-MM-dd");
  }

  const offset = getStudyTimezoneOffset();
  const dateClause = `"createdAt" > \'${startDate} 00:00:00.000${offset}\' and "createdAt" < \'${endDate} 23:59:59.999${offset}\'`;

  function getSurveyStatsQuery(byField: string): string {
    return `
    WITH t AS (
      SELECT t1.grouping, t1.formstarts, t2.eligible, t1.consented, t2.completed, t1.specimenscanned, t1.giftcards, t2.adverseevents, t1.questionsanswered, t2.declinedresponses
      FROM (
        SELECT visit->>'${byField}' AS grouping, 
                COUNT(*) AS formstarts, 
                SUM(CASE WHEN visit->'consents'->0->'terms' IS NOT NULL THEN 1 END) AS consented, 
                SUM(CASE WHEN visit->'samples'->0->'code' IS NOT NULL THEN 1 END) AS specimenscanned, 
                SUM(json_array_length(visit->'giftcards')) AS giftcards,
                SUM(json_array_length(visit->'responses'->0->'item')) AS questionsanswered 
        FROM visits 
        WHERE ${dateClause} AND visit->>'location' IS NOT NULL
        GROUP BY grouping
        ORDER BY grouping) t1
      LEFT JOIN (
        SELECT visit->>'${byField}' AS grouping,
               SUM(CASE WHEN items->>'id'='MedicalInsurance' THEN 1 END) AS completed,
               SUM(CASE WHEN items->>'id'='WhichProcedures' THEN 1 END) AS adverseevents,
               SUM(CASE WHEN (items->'answer'->0)::jsonb ? 'valueDeclined' THEN 1 END) as declinedresponses,
               SUM(CASE WHEN (items->>'id'='Symptoms' AND json_array_length(items->'answer') >= 2) THEN 1 END) as eligible
        FROM visits v, json_array_elements(v.visit->'responses'->0->'item') items 
        WHERE ${dateClause}
        GROUP BY grouping) t2
      ON (t1.grouping = t2.grouping)
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
    WHERE ${dateClause} AND json_array_length(visit->'responses'->0->'item') > 0 
    GROUP BY lastquestion 
    ORDER BY percent DESC;`;
  const lastQuestionData = filterLastQuestionData(
    client.querySync(lastQuestionQuery)
  );

  const giftCardQuery = `
    SELECT visit->>'location' AS location, 
           visit->'consents'->0->>'date' AS date, 
           giftcards->>'code' AS code, 
           giftcards->>'giftcardType' AS type,
           visit->>'administrator' AS administrator
    FROM visits v, json_array_elements(v.visit->'giftcards') giftcards 
    WHERE ${dateClause}
    ORDER BY date, location, type, code, administrator;`;
  const giftCardData = client.querySync(giftCardQuery);

  const studyIdQuery = `
    SELECT visit->>'location' AS location, 
           "createdAt" as starttime, 
           csruid as studyid,
           visit->>'administrator' AS administrator
    FROM visits
    WHERE ${dateClause} AND visit->'consents'->0->'terms' IS NOT NULL
    ORDER BY location, starttime;`;
  const studyIdData = client.querySync(studyIdQuery);

  const feedbackQuery = `
    SELECT COUNT(*) 
    FROM feedback
    WHERE ${dateClause};`;
  const feedbackData = client.querySync(feedbackQuery);

  return [
    surveyStatsData,
    surveyStatsByAdminData,
    lastQuestionData,
    giftCardData,
    studyIdData,
    feedbackData
  ];
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
  const excel = require("node-excel-export");

  const [
    surveyStatsData,
    surveyStatsByAdminData,
    lastQuestionData,
    giftCardData,
    studyIdData,
    feedbackData
  ] = getMetrics(startDate, endDate);

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

  const giftCardSpec = {
    date: {
      displayName: "Date",
      headerStyle: styles.columnHeader,
      width: 100
    },
    location: {
      displayName: "Location",
      headerStyle: styles.columnHeader,
      width: 150
    },
    administrator: {
      displayName: "Administrator",
      headerStyle: styles.columnHeader,
      width: 100
    },
    code: {
      displayName: "Code",
      headerStyle: styles.columnHeader,
      width: 150
    },
    type: {
      displayName: "Type",
      headerStyle: styles.columnHeader,
      width: 100
    }
  };

  const studyIdSpec = {
    location: {
      displayName: "Location",
      headerStyle: styles.columnHeader,
      width: 150
    },
    starttime: {
      displayName: "Start Time (" + getTimezoneAbbrev() + ")",
      headerStyle: styles.columnHeader,
      cellFormat: function(value, row) {
        return toStudyDateString(value);
      },
      width: 150
    },
    studyid: {
      displayName: "Study ID",
      headerStyle: styles.columnHeader,
      width: 500
    },
    administrator: {
      displayName: "Administrator",
      headerStyle: styles.columnHeader,
      width: 100
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
  const giftCardHeading = [
    [{ value: "Gift Cards Issued", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];
  const studyIdHeading = [
    [{ value: "Study IDs for Consented Participants", style: styles.title }],
    [dateRangeHeading],
    [generatedHeading]
  ];

  const merges = [
    { start: { row: 1, column: 1 }, end: { row: 1, column: 9 } },
    { start: { row: 2, column: 1 }, end: { row: 2, column: 9 } }
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
      name: "Gift Cards",
      merges: merges,
      heading: giftCardHeading,
      specification: giftCardSpec,
      data: giftCardData
    },
    {
      name: "Study ID",
      merges: merges,
      heading: studyIdHeading,
      specification: studyIdSpec,
      data: studyIdData
    }
  ]);

  return report;
}
