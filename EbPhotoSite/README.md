## Running locally

This project is hosted on Firebase. For local development you will need to install the Firebase CLI via `$ npm install -g firebase-tools` and login `$ firebase login`. Subsequently you should import and set the project `ebphotostore-staging` with an alias using `$ firebase use --add`. It is recommended to use the alias `default` which is the default target for the Firebase CLI.

Once the CLI is set to use the staging project you can create a local hosting envionment using `$ firebase serve` which will start the web app from your currrent workspace using the hosting rules in firebase.json.
