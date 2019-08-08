#!/bin/bash
set -e

POSTGRES="psql --username ${POSTGRES_USER}"

echo "Creating database: test_db_pii"

$POSTGRES <<EOSQL
CREATE DATABASE test_db OWNER '${POSTGRES_USER}';
EOSQL

$POSTGRES <<EOSQL
CREATE DATABASE test_db_pii OWNER '${POSTGRES_USER}';
EOSQL
