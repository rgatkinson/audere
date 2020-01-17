// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { ChillsSurveillanceClient } from "../external/chillsSurveillanceClient";
import { ChillsSurveillanceService } from "../services/chills/chillsSurveillanceService";
import { DataPipelineService } from "../services/data/dataPipelineService";
import { DataPipeline } from "../services/data/dataPipeline";
import { VirenaDataPipeline } from "../services/chills/virenaDataPipeline";
import { LazyAsync } from "../util/lazyAsync";
import { SplitSql } from "../util/sql";
import logger from "../util/logger";
import axios from "axios";
const JSZip = require("jszip");

export class ChillsSurveillanceEndpoint {
  private readonly service: LazyAsync<ChillsSurveillanceService>;
  private pipeline: DataPipeline;

  constructor(sql: SplitSql) {
    this.service = new LazyAsync(async () => {
      const data = await this.getCdcData();
      return new ChillsSurveillanceService(sql, data);
    });

    this.pipeline = new VirenaDataPipeline(sql.nonPii);
  }

  public import = async (req, res, next) => {
    const svc = await this.service.get();
    logger.info("Finding CDC reports to import");
    await svc.import();

    const pipelineSvc = new DataPipelineService();
    logger.info("Refreshing derived schema");
    pipelineSvc.refresh(this.pipeline);
    logger.info("Refresh complete");

    res.json({});
  };

  private getCdcData = async () => {
    const response = await axios({
      method: "post",
      url: "https://gis.cdc.gov/grasp/flu2/PostPhase02DataDownload",
      responseType: "arraybuffer",
      data: {
        AppVersion: "Public",
        DatasourceDT: [
          // data sets to download
          { ID: 0, Name: "WHO_NREVSS" },
          { ID: 1, Name: "ILINet" },
        ],
        RegionTypeId: 5, // state-level data
        SubRegionsDT: [
          // the 50 states and 9 territories/regions
          { ID: 1, Name: "1" },
          { ID: 2, Name: "2" },
          { ID: 3, Name: "3" },
          { ID: 4, Name: "4" },
          { ID: 5, Name: "5" },
          { ID: 6, Name: "6" },
          { ID: 7, Name: "7" },
          { ID: 8, Name: "8" },
          { ID: 9, Name: "9" },
          { ID: 10, Name: "10" },
          { ID: 11, Name: "11" },
          { ID: 12, Name: "12" },
          { ID: 13, Name: "13" },
          { ID: 14, Name: "14" },
          { ID: 15, Name: "15" },
          { ID: 16, Name: "16" },
          { ID: 17, Name: "17" },
          { ID: 18, Name: "18" },
          { ID: 19, Name: "19" },
          { ID: 20, Name: "20" },
          { ID: 21, Name: "21" },
          { ID: 22, Name: "22" },
          { ID: 23, Name: "23" },
          { ID: 24, Name: "24" },
          { ID: 25, Name: "25" },
          { ID: 26, Name: "26" },
          { ID: 27, Name: "27" },
          { ID: 28, Name: "28" },
          { ID: 29, Name: "29" },
          { ID: 30, Name: "30" },
          { ID: 31, Name: "31" },
          { ID: 32, Name: "32" },
          { ID: 33, Name: "33" },
          { ID: 34, Name: "34" },
          { ID: 35, Name: "35" },
          { ID: 36, Name: "36" },
          { ID: 37, Name: "37" },
          { ID: 38, Name: "38" },
          { ID: 39, Name: "39" },
          { ID: 40, Name: "40" },
          { ID: 41, Name: "41" },
          { ID: 42, Name: "42" },
          { ID: 43, Name: "43" },
          { ID: 44, Name: "44" },
          { ID: 45, Name: "45" },
          { ID: 46, Name: "46" },
          { ID: 47, Name: "47" },
          { ID: 48, Name: "48" },
          { ID: 49, Name: "49" },
          { ID: 50, Name: "50" },
          { ID: 51, Name: "51" },
          { ID: 52, Name: "52" },
          { ID: 54, Name: "54" },
          { ID: 55, Name: "55" },
          { ID: 56, Name: "56" },
          { ID: 58, Name: "58" },
          { ID: 59, Name: "59" },
        ],
        SeasonsDT: [
          // seasons 2017-18, 2018-19, 2019-20
          { ID: 59, Name: "59" },
          { ID: 58, Name: "58" },
          { ID: 57, Name: "57" },
        ],
      },
    });

    var dataSources = new Object();
    const zippedData = await JSZip.loadAsync(response.data);

    dataSources["clinical"] = await zippedData
      .file("WHO_NREVSS_Clinical_Labs.csv")
      .async("string");
    dataSources["clinical"] = dataSources["clinical"].replace(
      '"*Beginning for the 2015-16 season, reports from public health and clinical laboratories are presented separately in the weekly influenza update, FluView. Data from clinical laboratories include the weekly total number of specimens tested, the number of positive influenza test, and the percent positive by influenza type."\n',
      ""
    );

    dataSources["ilinet"] = await zippedData.file("ILINet.csv").async("string");
    dataSources["ilinet"] = dataSources["ilinet"].replace(
      "PERCENTAGE OF VISITS FOR INFLUENZA-LIKE-ILLNESS REPORTED BY SENTINEL PROVIDERS\n",
      ""
    );

    return new ChillsSurveillanceClient(dataSources);
  };
}
