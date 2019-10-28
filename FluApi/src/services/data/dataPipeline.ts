// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import { Sequelize } from "sequelize";

export interface DataPipeline {
  name: string;
  db: Sequelize;
  nodes: ManagedSqlNode[];
}

// Metadata for how to create some SQL node, e.g. type or view.
export interface SqlNodeMetadata {
  name: string;
  deps: string[];
  spec: string; // Specification for how to create.
}

export interface SequelizeTableReference {
  tableName: string;
  id: string;
  timestamp: string;
}

export interface ManagedSqlNode {
  readonly meta: SqlNodeMetadata;

  getCreate(): string[];
  getRefresh(): string[] | null;
  getDelete(): string;
}

export class ManagedSqlType implements ManagedSqlNode {
  readonly meta: SqlNodeMetadata;
  constructor(meta: SqlNodeMetadata) {
    this.meta = meta;
  }

  getCreate = () => [`create type ${this.meta.name} as ${this.meta.spec};`];
  getRefresh = () => null;
  getDelete = () => `drop type if exists ${this.meta.name} cascade;`;
}

export class ManagedView implements ManagedSqlNode {
  readonly meta: SqlNodeMetadata;
  constructor(meta: SqlNodeMetadata) {
    this.meta = meta;
  }

  getCreate = () => [`create view ${this.meta.name} as ${this.meta.spec};`];
  getRefresh = () => null;
  getDelete = () => dropTableLike(this.meta.name);
}

export class ManagedMaterializedView implements ManagedSqlNode {
  readonly meta: SqlNodeMetadata;
  constructor(meta: SqlNodeMetadata) {
    this.meta = meta;
  }

  getCreate = () => [
    `create materialized view ${this.meta.name} as ${this.meta.spec};`,
  ];
  getRefresh = () => [`refresh materialized view ${this.meta.name};`];
  getDelete = () => dropTableLike(this.meta.name);
}

export class ManagedTable implements ManagedSqlNode {
  readonly meta: SqlNodeMetadata;
  readonly deleteStaleRows: string;
  readonly insertNewRows: string;

  constructor(
    meta: SqlNodeMetadata,
    deleteStaleRows: string,
    insertNewRows: string
  ) {
    this.meta = meta;
    this.deleteStaleRows = deleteStaleRows;
    this.insertNewRows = insertNewRows;
  }

  getCreate = () => [
    `create table ${this.meta.name} as ${this.meta.spec};`,
    `alter table ${this.meta.name} add column id serial primary key;`,
    `alter table ${this.meta.name} add column "createdAt" timestamp default now();`,
  ];
  getRefresh = () => [this.deleteStaleRows, this.insertNewRows];
  getDelete = () => dropTableLike(this.meta.name);
}

export class SequelizeSourceTable extends ManagedTable {
  constructor(meta: SqlNodeMetadata, ref: SequelizeTableReference) {
    super(
      meta,
      `
      delete from ${meta.name}
      where id in (
        select
          tbl.id
        from
          ${meta.name} as tbl
          left join ${ref.tableName} as source on source.id = tbl."${ref.id}"
        where
          source."updatedAt" is null
          or tbl."${ref.timestamp}" < source."updatedAt"
      )
      `,
      `
      insert into ${meta.name}
      select
        spec.*
      from
        (${meta.spec}) as spec
        left join ${meta.name} as tbl on tbl."${ref.id}" = spec."${ref.id}"
      where
        tbl.id is null
      `
    );
  }
}

// We drop table, view, or materialized view to handle cases where
// we change the type.
function dropTableLike(fullName: string) {
  const dotIndex = fullName.indexOf(".");
  const name = fullName.substring(dotIndex + 1);
  const schema = dotIndex < 0 ? "public" : fullName.substring(0, dotIndex);

  return `
    do $$ begin
      ${drop(name, schema, "table", "table")};
      ${drop(name, schema, "view", "view")};
      ${drop(name, schema, "matview", "materialized view")};
    end $$
  `;

  function drop(name: string, schema: string, pgShort: string, pgFull: string) {
    return `
      if exists (
        select * from pg_${pgShort}s
        where schemaname='${schema}' and ${pgShort}name='${name}'
      ) then
        drop ${pgFull} if exists ${schema}.${name} cascade;
      end if
    `;
  }
}
