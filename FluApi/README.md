# FluApi

Express web service for persisting flu study documents into underlying storage. Uses separate Postgres databases for PII and non-PII information.

## Developer setup

This service requires valid build information and an active Postgres database to run. A local Postgres database is used by default as configured in your .env file. To run the application locally:

1. Copy .env.example to .env.
2. Setup a local Postgres database matching your .env file (user, port, db name).
3. Run `yarn install`.
4. Run `yarn setup`.
5. Run `yarn start`. 

## Database

This application requires a database with PostGIS extensions available. It is recommended to use [mdillon/postgis](https://hub.docker.com/r/mdillon/postgis/) in a Docker environment.

### Database migrations

Database migrations are managed using Sequelize. Migrations should be checked in to the [db/migrations folder](https://github.com/AudereNow/learn/tree/master/FluApi/db/migrations) and should include an up Promise for application and a down Promise for undo. Migrations are run as part of the `yarn setup` step and new migrations can be applied by rerunning `yarn setup`.

## Shared

Some types are shared between FluApi and other applications. These are imported as a [common lib](https://github.com/AudereNow/learn/tree/master/lib) and shared within this repo.
