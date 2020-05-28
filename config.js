// create and export config variables

// container for all the environments

var environments = {};

// production environment
environments.production = {
  httpPort: 5000,
  httpsPort:5001,
  envName: "production",
  hashingSecret:"itIsASecret",
  maxChecks:5,
  twilio:{
    accountSid:"ACd22ec625f7e7320bc7eb1ad298c317fd",
    authToken:"e04afbed70581428d5a411267bd10c6a",
    fromPhone:"+12068886659"
  }
};

// staging(default )environment
environments.staging = {
  httpPort: 3000,
  httpsPort:3001,
  envName: "staging",
  hashingSecret:"itIsASecret",
  maxChecks:5,
  twilio:{
    accountSid:"ACb32d411ad7fe886aac54c665d25e5c5d",
    authToken:"9455e3eb3109edc12e3d8c92768f7a67",
    fromPhone:"+15005550006"
  }
};

// determine which environment was passed as command line arg

var currentEnvironment =
  typeof(process.env.NODE_ENV) == "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// checking the current environments passed is present above or not otherwise default staging is used

var environmentToExport =
  typeof( environments[currentEnvironment]) == "object"
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environmentToExport;
