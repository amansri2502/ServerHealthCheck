// primary file for API

// Dependencies

const http = require("http");
const url = require("url");
const config = require("./config");
const https = require("https");
const fs = require("fs");
const handlers=require("./lib/handler");
const helpers=require('./lib/helper');

// this dependency helps in decodeing the stream of bytes coming to the utf 8 format
const stringDecoder = require("string_decoder").StringDecoder;

helpers.sendTwilioSms('4158375309','hi',function(err){
  console.log(err);
})
// instantiate http server
var httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

//instantiating https server

let httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
let httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

// started listening http

httpServer.listen(config.httpPort, function () {
  console.log("server is running at " + config.httpPort);
});

// starting to listen https
httpsServer.listen(config.httpsPort, function () {
  console.log("server is running at " + config.httpsPort);
});

//unified server for both http and https

let unifiedServer = function (req, res) {
  //get the url and parse it
  var parsedUrl = url.parse(req.url, true); // true parameter pass the url to query string module
  var pathName = parsedUrl.pathname;
  var trimPath = pathName.replace(/^\/+|\/+$/g, "");

  // request method

  var method = req.method;


  // quary string object
  var queryStringObject = parsedUrl.query;

  // header

  var header = req.headers;

  var decoder = new stringDecoder("UTF-8");
  // buffer to store stream one by one (initially empty)

  var buffer = "";

  // on the  event called by request object  with data this function is called and the content is appended to buffer

  req.on("data", function (data) {
    buffer += decoder.write(data);
  });

  // on end

  req.on("end", function () {
    buffer += decoder.end();

    var choosenHandler =
      typeof router[trimPath] !== "undefined"
        ? router[trimPath]
        : handlers.notFound;

    var data = {
      queryStringObject: queryStringObject,
      payload: helpers.parseJsonToObject(buffer),
      method: method,
      header:header
    };
  

    choosenHandler(data, function (statusCode, payload) {
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      payload = typeof payload === "object" ? payload : {};

      var payloadString = JSON.stringify(payload);

      res.setHeader("Content-Type", "application/json"); // it is just used to tell brouser the type of content that is been sent i.e json
      res.writeHead(statusCode);
      res.end(payloadString);
    });

    console.log("this is payload", buffer);
  });
};


// defining a request router
var router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens:handlers.tokens,
  checks:handlers.checks
};
