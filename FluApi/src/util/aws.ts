import AWS from "aws-sdk";

AWS.config.update({
  region: "us-west-2",
  credentialProvider: new AWS.CredentialProviderChain([
    () => new AWS.SharedIniFileCredentials(),
    () => new AWS.EC2MetadataCredentials()
  ])
});

export { AWS };
