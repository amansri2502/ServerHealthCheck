// helper for various tasks

//dependency

let crypto = require("crypto");
let config = require("../config");
let querystring = require("querystring");
let https = require("https");

//container for all helpers
let helper = {};

//create a SHA256 hash available in node
helper.hash = function (str) {
  if (typeof str == "string" && str.length > 0) {
    let hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};
// parse a JSON string to a object in all cases

helper.parseJsonToObject = function (str) {
  try {
    let obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};
helper.createRandomString = function (stringlen) {
  stringlen = typeof stringlen == "number" && stringlen > 0 ? stringlen : false;
  if (stringlen) {
    // define all possible charescters that can be in the token string
    let possibleCharecters = "abcdefghijklmnopqrstuvwxyz0123456789";
    // start the final string
    let str = "";
    for (i = 1; i <= stringlen; i++) {
      let randomChar = possibleCharecters.charAt(
        Math.floor(Math.random() * possibleCharecters.length)
      );

      // append it to the string
      str += randomChar;
    }

    return str;
  } else {
    return false;
  }
};

helper.sendTwilioSms = function (phone, msg, callback) {
  phone =
    typeof phone == "string" && phone.trim().length == 10
      ? phone.trim()
      : false;
  msg =
    typeof msg == "string" && msg.trim().length > 0 && msg.trim().length <= 1600
      ? msg.trim()
      : false;
  if (phone && msg) {
    //configure the request payload
    var payload = {
      from: config.twilio.fromPhone,
      To: "+1" + phone,
      body: msg,
    };

    // stringify the payload
    var stringPayload = querystring.stringify(payload);
    // configure the request details
    var requestDetails = {
      protocol: "https:",
      method: "POST",
      hostname: "api.twilio.com",
      path:
        "./2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };
    // instantiate the request object
    var req = https.request(requestDetails, function (res) {
      // grab the ststus of the sent request
      var status = res.statusCode;
      // callback successfully if the request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback("Status code returned was" + status);
      }
    });
    // bind to the error event so it doen't get thrown
    req.on("error",function(e){
      callback(e)
    })
    // add the payload
    req.write(stringPayload);
    // End the request
    req.end();
  } else {
    callback("given params missing or invalid");
  }
};

// module export
module.exports = helper;
