// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { promises as fs } from "fs";
import { Op, json } from "sequelize";
import querystring from "querystring";
import { sha256 } from "../../util/crypto";
import { SplitSql } from "../../util/sql";
import { ChillsModels, defineChillsModels } from "../../models/db/chills";
import { SiteUserModels, defineSiteUserModels } from "./models";
import { AuthManager, Permission } from "./auth";

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

const BARCODE_SAMPLE_TYPES = [
  "manualEntry",
  "org.iso.Code128",
  "org.iso.Code39",
  "1",
  "2",
];

export class ChillsRDTPhotos {
  constructor(
    sql: SplitSql,
    getStatic: () => string,
    authManager: AuthManager
  ) {
    this.models = defineChillsModels(sql);
    this.siteUserModels = defineSiteUserModels(sql);
    this.getStatic = getStatic;
    this.authManager = authManager;
  }

  private models: ChillsModels;
  private siteUserModels: SiteUserModels;
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
      where: {
        survey: {
          isDemo: false,
          samples: {
            [Op.or]: {
              [Op.like]: "%RDTReaderPhotoGUID%",
              [Op.like]: "%PhotoGUID%",
            },
          },
        },
      },
      include: [this.models.expertRead],
      order,
      limit: PAGE_SIZE + 1,
      offset: page * PAGE_SIZE,
    });

    const title = "flu@home U.S. Photos";
    const barcodes = surveys.slice(0, PAGE_SIZE).map(survey => {
      const barcodeSample = survey.survey.samples.find(sample =>
        BARCODE_SAMPLE_TYPES.includes(sample.sample_type)
      );
      return {
        barcode: barcodeSample ? barcodeSample.code : "Missing barcode",
        date: survey.createdAt.toLocaleDateString(),
        time: survey.createdAt.toLocaleTimeString(),
        url: `chillsPhoto?id=${survey.id}`,
        pii: "Not Reviewed",
        expert_read: survey.expert_read
          ? INTERPRETATIONS[survey.expert_read.interpretation]
          : "Not interpreted",
        photo_type: survey.survey.samples.find(
          sample => sample.sample_type === "RDTReaderPhotoGUID"
        )
          ? "Automatic Capture"
          : "Manual Photo",
      };
    });

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
      title,
      barcodes,
      static: this.getStatic(),
      hasPrevPage,
      hasNextPage,
      nextPageLink,
      prevPageLink,
      dateSortLink,
      barcodeSortLink,
      shouldShowPII: false,
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

    const canInterpret = await this.authManager.authorize(
      req.user.userid,
      Permission.CHILLS_INTERPRETATION_WRITE
    );
    if (!canInterpret) {
      res.sendStatus(401);
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
            id: photoRecord.id,
            label: LABELS[sample.sample_type],
            src: "data:;image/png;base64," + photoRecord.photo.jpegBase64,
          };
        })
    );

    const expertRead = await this.models.expertRead.findOne({
      where: { surveyId: id },
    });
    const previousInterpreter =
      expertRead &&
      (await this.siteUserModels.user.findById(expertRead.interpreterId))
        .userid;
    const oldInterpretation = expertRead && expertRead.interpretation;
    const interpretations = Object.keys(INTERPRETATIONS).map(
      interpretation => ({
        value: interpretation,
        label: INTERPRETATIONS[interpretation],
        checked: checked(oldInterpretation === interpretation),
      })
    );

    const canReplace = await this.authManager.authorize(
      req.user.userid,
      Permission.CHILLS_RDT_PHOTOS_WRITE
    );

    res.render("chillsRdtPhotos.html", {
      photos,
      static: this.getStatic(),
      surveyId: id,
      csrf: req.csrfToken(),
      canReplace,
      canInterpret,
      interpretations,
      previousInterpreter,
    });
  };

  public setExpertRead = async (req, res) => {
    const { surveyId, interpretation } = req.body;
    const interpreterId = req.user.id;
    if (interpretation !== undefined) {
      const oldInterpretation = await this.models.expertRead.findOne({
        where: { surveyId },
      });
      if (
        !oldInterpretation ||
        oldInterpretation.interpretation !== interpretation
      ) {
        await this.models.expertRead.upsert({
          surveyId,
          interpretation,
          interpreterId,
        });
      }
    }
    res.redirect(303, `./chillsPhoto?id=${surveyId}`);
  };

  public replacePhoto = async (req, res) => {
    const { photoId, surveyId } = req.fields;
    const { photoReplacement } = req.files;
    const newPhoto = (await fs.readFile(photoReplacement.path)).toString(
      "base64"
    );
    const newPhotoHash = sha256(newPhoto);
    const photoRecord = await this.models.photo.findById(photoId);
    const oldPhotoHash = sha256(photoRecord.photo.jpegBase64);
    photoRecord.photo.jpegBase64 = newPhoto;
    await this.models.photo.update(
      { photo: photoRecord.photo },
      { where: { id: photoId } }
    );
    await this.models.photoReplacementLog.create({
      photoId,
      oldPhotoHash,
      newPhotoHash,
      replacerId: req.user.id,
    });

    // Replace the photo in S3 as well
    await this.models.photoUploadLog.destroy({
      where: {
        surveyId,
      },
    });

    res.redirect(303, `./chillsPhoto?id=${surveyId}`);
  };
}

function checked(c: boolean) {
  return c ? "checked" : "";
}
