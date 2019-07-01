import archiver from "archiver";
import * as AWS from "aws-sdk";
import querystring from "querystring";
import { SplitSql } from "../../util/sql";
import { getS3Config, S3Config } from "../../util/s3Config";
import { SecretConfig } from "../../util/secretsConfig";
import { LazyAsync } from "../../util/lazyAsync";

type RenderOpts = {
  static: string;
  title: string;
};

export class S3DirectoryServer {
  private readonly path: string;
  private readonly renderOpts: () => RenderOpts;
  private readonly sql: SplitSql;
  private s3: LazyAsync<{ s3: AWS.S3; s3Config: S3Config }>;

  constructor(sql: SplitSql, path: string, renderOpts: () => RenderOpts) {
    this.sql = sql;
    this.path = path;
    this.renderOpts = renderOpts;
    this.s3 = new LazyAsync(async () => {
      return {
        s3: new AWS.S3({ region: "us-west-2", signatureVersion: "v4" }),
        s3Config: await getS3Config(new SecretConfig(this.sql))
      };
    });
  }

  performRequest = async (req, res) => {
    if (req.query.archive) {
      return this.archiveFiles(req, res);
    }
    return this.listFiles(req, res);
  };

  private async listFiles(req, res) {
    const { s3, s3Config } = await this.s3.get();
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: s3Config.fluReportsBucket,
      Prefix: this.path
    };
    if (req.query.startAfter) {
      params.StartAfter =
        this.path + querystring.unescape(req.query.startAfter);
    }
    const response = await s3.listObjectsV2(params).promise();
    let lastKey;
    const files = response.Contents.map(obj => {
      lastKey = obj.Key;
      return {
        url: s3.getSignedUrl("getObject", {
          Bucket: s3Config.fluReportsBucket,
          Key: obj.Key
        }),
        label: obj.Key.substring(this.path.length)
      };
    });
    res.render("s3files.html", {
      ...this.renderOpts(),
      files,
      archiveUrl: "?archive=true",
      nextUrl: response.IsTruncated
        ? `?startAfter=${querystring.escape(
            lastKey.substring(this.path.length)
          )}`
        : null
    });
  }

  private async archiveFiles(req, res) {
    const { s3, s3Config } = await this.s3.get();
    res.header("content-disposition", 'attachment; filename="documents.zip"');
    const archive = archiver("zip", { zlib: { level: 9 } });
    const archivePromise = new Promise((res, rej) => {
      archive.on("error", rej);
      archive.on("end", res);
    });
    archive.pipe(res);
    let response: AWS.S3.ListObjectsV2Output;
    do {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: s3Config.fluReportsBucket,
        Prefix: this.path
      };
      if (response) {
        params.ContinuationToken = response.NextContinuationToken;
      }
      response = await s3.listObjectsV2(params).promise();
      const keys = response.Contents.map(obj => obj.Key);
      await Promise.all(
        keys.map(async key => {
          const file = await s3
            .getObject({
              Bucket: s3Config.fluReportsBucket,
              Key: key
            })
            .promise();
          console.log(key.substring(this.path.length));
          archive.append(file.Body, {
            name: key.substring(this.path.length)
          });
        })
      );
    } while (response.IsTruncated);
    archive.finalize();
    await archivePromise;
  }
}
