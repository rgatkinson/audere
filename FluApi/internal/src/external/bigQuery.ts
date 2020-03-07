// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { BigQuery } from "@google-cloud/bigquery";
import { TableMetadata } from "@google-cloud/bigquery/build/src/table";
import bigquery from "@google-cloud/bigquery/build/src/types";
import { BigQueryConfig } from "../util/bigQueryConfig";
import logger from "../util/logger";

export class PagedQueryResult<T> {
  public results: T[];
  public token: string;
}

/**
 * Wraps the BigQuery client API
 */
export class BigQueryTableImporter {
  private readonly config: BigQueryConfig;
  private readonly client: BigQuery;

  constructor(config: BigQueryConfig) {
    this.config = config;
    this.client = new BigQuery({
      projectId: this.config.project,
      credentials: {
        client_email: this.config.email,
        private_key: this.config.key.replace(/\\n/g, "\n"),
      },
    });
  }

  /**
   * List tables within the configured dataset
   */
  public async listTables(): Promise<string[]> {
    const response = await this.client.dataset(this.config.dataset).getTables();

    const tables = response[0];
    logger.info(`Listed ${tables.length} tables within ${this.config.dataset}`);
    return tables.map(t => (<TableMetadata>t.metadata).tableReference.tableId);
  }

  /**
   * Get full table metadata since list table doesn't populate modified time
   *
   * @param table Table id/name
   */
  public async getTableMetadata(table: string): Promise<TableMetadata> {
    const [metadata] = await this.client
      .dataset(this.config.dataset)
      .table(table)
      .getMetadata();

    return <TableMetadata>metadata;
  }

  /**
   * List table rows for the specified table. Optionally provides a token for
   * progress within paged responses.
   *
   * @param table Table id/name
   * @param pageToken Token for paged queries
   */
  public async getTableRows(
    table: string,
    pageToken?: string
  ): Promise<PagedQueryResult<any>> {
    let options = {
      // If autoPaginate is not set all results are eagerly fetched
      autoPaginate: false,

      // Currently hardcoding 10k max per request
      maxResults: 10000,
    };

    if (pageToken != null) {
      options["pageToken"] = pageToken;
    }

    const result = await this.client
      .dataset(this.config.dataset)
      .table(table)
      .getRows(options);

    const token = (<bigquery.ITableDataList>result[2]).pageToken;

    logger.info(
      `Received ${result[0].length} rows from table ${table} with page token ${token}`
    );

    return {
      results: result[0],
      token: token,
    };
  }
}
