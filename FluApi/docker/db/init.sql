-- Copyright (c) 2019 by Audere
--
-- Use of this source code is governed by an MIT-style license that
-- can be found in the LICENSE file distributed with this file.

create role api;
create role metabase;

create database pii owner api;
create database nonpii owner api;
