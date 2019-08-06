## Running locally

This project is hosted on Firebase. For local development you will need to install the Firebase CLI via `$ npm install -g firebase-tools` and login `$ firebase login`. Subsequently you should import and set the project `ebphotostore-staging` with an alias using `$ firebase use --add`. It is recommended to use the alias `default` which is the default target for the Firebase CLI.

Once the CLI is set to use the staging project you can start the web app locally by running `yarn start` and navigating to `localhost:3000`, if it doesn't open automatically.
