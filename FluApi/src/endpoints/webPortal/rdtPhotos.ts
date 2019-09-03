// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Op, cast, json, where, col, fn } from "sequelize";
import querystring from "querystring";
import { SplitSql } from "../../util/sql";
import { CoughModels, defineCoughModels } from "../../models/db/cough";
import { AuthManager, Permissions } from "./auth";

const LABELS = {
  RDTReaderPhotoGUID: "Automatic Capture",
  RDTReaderHCPhotoGUID: "Cropped and Enhanced Result Window",
  PhotoGUID: "Manual Capture",
};

const ORDER_OPTIONS = {
  barcode_asc: [[json("survey.samples[0].code") as string, "ASC"]],
  barcode_desc: [[json("survey.samples[0].code") as string, "DESC"]],
  date_asc: [["createdAt", "ASC"]],
  date_desc: [["createdAt", "DESC"]],
};

const PAGE_SIZE = 50;

const INTERPRETATIONS = {
  badPicture: "Unusable Photo",
  noBlue: "Invalid Result (no blue line)",
  noPink: "No pink line",
  yesAboveBlue: "Pink line above the blue line",
  yesBelowBlue: "Pink line below the blue line",
  yesAboveBelowBlue: "Pink lines above and below the blue line",
};

export class RDTPhotos {
  constructor(
    sql: SplitSql,
    getStatic: () => string,
    authManager: AuthManager
  ) {
    this.models = defineCoughModels(sql);
    this.getStatic = getStatic;
    this.authManager = authManager;
  }

  private models: CoughModels;
  private getStatic: () => string;
  private authManager: AuthManager;

  public listBarcodes = async (req, res) => {
    const page =
      req.query.page && !isNaN(parseInt(req.query.page))
        ? parseInt(req.query.page)
        : 0;
    const orderBy = Object.keys(ORDER_OPTIONS).includes(req.query.orderBy)
      ? req.query.orderBy
      : "date_asc";
    const order = ORDER_OPTIONS[orderBy];
    const surveys = await this.models.survey.findAll({
      where: [
        {
          survey: {
            isDemo: false,
            samples: {
              [Op.like]: "%manualEntry%",
              [Op.or]: {
                [Op.like]: "%RDTReaderPhotoGUID%",
                [Op.like]: "%PhotoGUID%",
              },
            },
          },
        },
      ],
      order,
      limit: PAGE_SIZE + 1,
      offset: page * PAGE_SIZE,
    });

    const barcodes = surveys.slice(0, PAGE_SIZE).map(survey => ({
      barcode: survey.survey.samples.find(
        sample => sample.sample_type === "manualEntry"
      ).code,
      date: survey.createdAt.toLocaleDateString(),
      time: survey.createdAt.toLocaleTimeString(),
      url: `coughPhoto?id=${survey.id}`,
    }));

    const dateSortLink =
      "?" +
      querystring.stringify({
        orderBy: orderBy === "date_asc" ? "date_desc" : "date_asc",
      });
    const barcodeSortLink =
      "?" +
      querystring.stringify({
        orderBy: orderBy === "barcode_asc" ? "barcode_desc" : "barcode_asc",
      });
    const hasNextPage = surveys.length === PAGE_SIZE + 1;
    const hasPrevPage = page > 0;
    const nextPageLink = hasNextPage
      ? "?" + querystring.stringify({ page: page + 1, orderBy })
      : "";
    const prevPageLink = hasPrevPage
      ? "?" + querystring.stringify({ page: page - 1, orderBy })
      : "";
    res.render("barcodes.html", {
      barcodes,
      static: this.getStatic(),
      hasPrevPage,
      hasNextPage,
      nextPageLink,
      prevPageLink,
      dateSortLink,
      barcodeSortLink,
    });
  };

  public showPhotos = async (req, res) => {
    const { id } = req.query;
    if (!id) {
      res.status(404).send("No id specified");
      return;
    }
    const survey = await this.models.survey.findOne({ where: { id } });
    if (!survey) {
      res.status(404).send("Survey not found");
      return;
    }

    const photos = await Promise.all(
      survey.survey.samples
        .filter(sample =>
          ["RDTReaderPhotoGUID", "RDTReaderHCPhotoGUID", "PhotoGUID"].includes(
            sample.sample_type
          )
        )
        .map(async sample => {
          const photoRecord = await this.models.photo.findOne({
            where: {
              docId: sample.code,
            },
          });
          if (!photoRecord) {
            return {
              label: "Error: This record references a photo that was not found",
              src: "",
            };
          }
          return {
            label: LABELS[sample.sample_type],
            src: "data:;image/png;base64," + photoRecord.photo.jpegBase64,
          };
        })
    );

    const canInterpret = await this.authManager.authorize(
      req.user.userid,
      Permissions.COUGH_INTERPRETATION_WRITE
    );
    const expertRead = await this.models.expertRead.findOne({
      where: { surveyId: id },
    });
    const oldInterpretation = expertRead && expertRead.interpretation;
    const interpretations = Object.keys(INTERPRETATIONS).map(
      interpretation => ({
        value: interpretation,
        label: INTERPRETATIONS[interpretation],
        checked: oldInterpretation === interpretation ? "checked" : "",
      })
    );
    res.render("rdtPhotos.html", {
      photos,
      static: this.getStatic(),
      surveyId: id,
      csrf: req.csrfToken(),
      canInterpret,
      interpretations,
    });
  };

  public setExpertRead = async (req, res) => {
    const { surveyId, interpretation } = req.body;
    const interpreterId = req.user.id;
    await this.models.expertRead.upsert({
      surveyId,
      interpretation,
      interpreterId,
    });
    res.redirect(303, `./coughPhoto?id=${surveyId}`);
  };
}
