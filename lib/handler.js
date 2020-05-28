//request handlers

//dependencies
let _data = require("./data");
let helper = require("./helper");
let config = require("../config");

// defining handlers
var handlers = {};

handlers.users = function (data, callback) {
  let acceptableMethods = ["POST", "GET", "DELETE", "PUT"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    // if method present in acceeptable list then

    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};
// container for users submethods

handlers._users = {};

// users-post

handlers._users.POST = function (data, callback) {
  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 8
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;
  console.log(firstName, lastName, password, phone, tosAgreement);

  if (firstName && lastName && tosAgreement && phone && password) {
    // to check if user exist err? notexist:exist
    _data.read("users", phone, function (err, data) {
      console.log(err, data);
      if (err) {
        let hashedPassword = helper.hash(password);
        if (hashedPassword) {
          let userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            password: hashedPassword,
            tosAgreement: true,
          };
          _data.create("users", phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { error: "could not create the new user" });
            }
          });
        } else {
          callback(500, { error: "could not hash user's password" });
        }
      } else {
        callback(400, { error: "user already exist" });
      }
    });
  } else {
    callback(400, { error: "missing required field's" });
  }
};

// users- PUT
handlers._users.PUT = function (data, callback) {
  // requird field
  let phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  // optional field
  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 8
      ? data.payload.password.trim()
      : false;

  // getting token from header
  let token = typeof data.header.token == "string" ? data.header.token : false;
  // function call
  handlers._tokens.verifyToken(phone, token, function (tokenIsValid) {
    if (tokenIsValid) {
      if (phone) {
        if (firstName || lastName || password) {
          _data.read("users", phone, function (err, userData) {
            if (!err && userData) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.password = helper.hash(password);
              }

              //update the data
              _data.update("users", phone, userData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, { error: "could not update the user" });
                }
              });
            } else {
              callback(400, { err: "the specified user does not exist" });
            }
          });
        } else {
          callback(400, { error: "missing optional field to update" });
        }
      } else {
        callback(400, { error: "missing required field" });
      }
    } else {
      callback(403, { error: "supplyed phone number and token do not match" });
    }
  });
};

// user-delete
// unchecked 
handlers._users.DELETE = function (data, callback) {
  let phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  // getting token from header
  let token = typeof data.header.token == "string" ? data.header.token : false;
  // function call
  handlers._tokens.verifyToken(phone, token, function (tokenIsValid) {
    if (tokenIsValid) {
      if (phone) {
        _data.read("users", phone, function (err, data) {
          if (!err && data) {
            // remove hashed password before sending data to user
            _data.delete("users", phone, function (err, data) {
              if (!err) {
                // deleting all checks associated with user
                let userChecks =
                  typeof data.checks == "object" && data.checks instanceof Array
                    ? data.checks
                    : false;
                let checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionError = false;
                  userChecks.forEach(function (CheckId) {
                    _data.delete("checks", checkId, function (err) {
                      if (err) {
                        deletionError = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionError) {
                          callback(200);
                        } else {
                          callback(500, {
                            error:
                              "error occured while attempting to delete user due to related items",
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { error: "could not delete specified object" });
              }
            });
          } else {
            callback(400, { err: "could not find specified user" });
          }
        });
      } else {
        callback(400, { error: "missing required field" });
      }
    } else {
      callback(403, { error: "supplyed phone number and token do not match" });
    }
  });
};

//users-GET
handlers._users.GET = function (data, callback) {
  let phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  // derive token from header
  let token = typeof data.header.token == "string" ? data.header.token : false;
  // verify that the given token is valid for thre specified phone number
  handlers._tokens.verifyToken(phone, token, function (tokenIsValid) {
    if (tokenIsValid) {
      if (phone) {
        _data.read("users", phone, function (err, data) {
          if (!err && data) {
            // remove hashed password before sending data to user
            delete data.password;
            callback(200, data);
          } else {
            callback(404, { err: "user not found" });
          }
        });
      } else {
        callback(400, { error: "missing required field" });
      }
    } else {
      callback(403, { error: "supplyed phone number and token do not match" });
    }
  });
};

// tokens
handlers.tokens = function (data, callback) {
  let acceptableMethods = ["POST", "GET", "DELETE", "PUT"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    // if method present in acceeptable list then

    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};
// submethod container for tokens
handlers._tokens = {};

// tokens-GET
// requird field id
// optional field null
handlers._tokens.GET = function (data, callback) {
  let id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { err: "token not found" });
      }
    });
  } else {
    callback(400, { error: "missing required field" });
  }
};

//required data: phone, password
//optionalData:null
handlers._tokens.POST = function (data, callback) {
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 8
      ? data.payload.password.trim()
      : false;
  console.log(password, phone);

  if (phone && password) {
    // lookup for the user that matches that phone number
    _data.read("users", phone, function (err, userData) {
      if (!err && userData) {
        // hash the sent password and compare it to the stored one
        let hashedPassword = helper.hash(password);
        if (hashedPassword == userData.password) {
          // now create a token with random name and create expireation period to one hour
          let tokenId = helper.createRandomString(20);
          let expires = Date.now() + 1000 * 60 * 60;
          let tokenObject = {
            phone: phone,
            tokenId: tokenId,
            expires: expires,
          };
          if (tokenId) {
            _data.create("tokens", tokenId, tokenObject, function (err) {
              if (!err) {
                callback(200, tokenObject);
              } else {
                callback(500, { error: "could not create new token" });
              }
            });
          } else {
            callback(500, { error: "token cannot be created" });
          }
        } else {
          callback(400, { error: "Password did not Match the specified user" });
        }
      } else {
        callback(400, { error: "user not found" });
      }
    });
  } else {
    callback(400, { error: "Missing Required Field" });
  }
};
// token-put
// requird:id,extend(callled by user to extend the token validity)
// optional:null
handlers._tokens.PUT = function (data, callback) {
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  var extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;
  //   console.log(extend,id);
  console.log(id, extend);
  if (extend && id) {
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires == Date.now() + 1000 * 60 * 60;
          _data.update("tokens", id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { error: "cannot update token" });
            }
          });
        } else {
          callback(400, { error: "cannot extend a expired token" });
        }
      } else {
        callback(400, { error: "user not found" });
      }
    });
  } else {
    callback(400, {
      error: "missing required firld(s) of field(s) are invalid",
    });
  }
};
// token-delete
//required:id
//optional :null
handlers._tokens.DELETE = function (data, callback) {
  let id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, function (err, data) {
      if (!err && data) {
        // remove hashed password before sending data to user
        _data.delete("tokens", id, function (err, data) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { error: "could not delete specified object" });
          }
        });
      } else {
        callback(400, { err: "could not find specified user" });
      }
    });
  } else {
    callback(400, { error: "missing required field" });
  }
};

handlers._tokens.verifyToken = function (phone, id, callback) {
  _data.read("tokens", id, function (err, data) {
    if (!err && data) {
      if (data.phone == phone && data.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

//checks
handlers.checks = function (data, callback) {
  let acceptableMethods = ["POST", "GET", "DELETE", "PUT"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    // if method present in acceeptable list then

    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};
// container for users submethods

handlers._checks = {};

// check post
//Requird data:protocol, url, method,sucessCode,timeout
//optional data:null

handlers._checks.POST = function (data, callback) {
  let protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  let url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  let method =
    typeof data.payload.method == "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  let successCode =
    typeof data.payload.successCode == "object" &&
    data.payload.successCode instanceof Array &&
    data.payload.successCode.length > 0
      ? data.payload.successCode
      : false;
  let timeOutSeconds =
    typeof data.payload.timeOutSeconds == "number" &&
    data.payload.timeOutSeconds % 1 === 0 &&
    data.payload.timeOutSeconds >= 1 &&
    data.payload.timeOutSeconds <= 7
      ? data.payload.timeOutSeconds
      : false;

  if (method && url && timeOutSeconds && successCode && protocol) {
    let token =
      typeof data.header.token == "string" ? data.header.token : false;
    _data.read("tokens", token, function (err, tokenData) {
      if (!err && tokenData) {
        let phone = tokenData.phone;
        _data.read("users", phone, function (err, userData) {
          if (!err && userData) {
            // lookup the userData
            let userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];
            // verify that user has less then the specified no of checks
            if (userChecks.length < config.maxChecks) {
              // create a random id for check
              let checkId = helper.createRandomString(20);
              // create the check object and include the users phone
              let checkObject = {
                id: checkId,
                userPhone: phone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCode,
                timeOutSeconds: timeOutSeconds,
              };

              // save the checkObject
              _data.create("checks", checkId, checkObject, function (err) {
                if (!err) {
                  // add the check id to users object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);
                  // update userData
                  _data.update("users", phone, userData, function (err) {
                    // return the detail about the new check added
                    callback(200, checkObject);
                  });
                } else {
                  callback(500, { error: "could not create the check object" });
                }
              });
            } else {
              callback(400, {
                error: "The user already has the maximum no of checks",
              });
            }
          } else {
            callback(403, { error: "user not found for specified token" });
          }
        });
      } else {
        callback(403, { error: "unauthorised user" });
      }
    });
  } else {
    callback(400, { error: "missing required input or input is invalid" });
  }
};

// get- checks
// required data:id
//optional : null

handlers._checks.GET = function (data, callback) {
  let id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("checks", id, function (err, checkData) {
      if (!err && checkData) {
        // derive token from header
        let token =
          typeof data.header.token == "string" ? data.header.token : false;
        // verify that the given token is valid for thre specified phone number
        handlers._tokens.verifyToken(checkData.userPhone, token, function (
          tokenIsValid
        ) {
          if (tokenIsValid) {
            callback(200, checkData);
          } else {
            callback(403, { error: "Data invalid" });
          }
        });
      } else {
        callback(400, { error: "checkId not found" });
      }
    });
  } else {
    callback(400, { error: "missing required Data" });
  }
};

// checks-put
// required:id
// optional field anything from checkObject (atleast one is important)
handlers._checks.PUT = function (data, callback) {
  let id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  let protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  let url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  let method =
    typeof data.payload.method == "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  let successCode =
    typeof data.payload.successCode == "object" &&
    data.payload.successCode instanceof Array &&
    data.payload.successCode.length > 0
      ? data.payload.successCode
      : false;
  let timeOutSeconds =
    typeof data.payload.timeOutSeconds == "number" &&
    data.payload.timeOutSeconds % 1 === 0 &&
    data.payload.timeOutSeconds >= 1 &&
    data.payload.timeOutSeconds <= 7
      ? data.payload.timeOutSeconds
      : false;
  if (id) {
    //check for atleast one optional field is present
    if (protocol || url || method || successCode || timeOutSeconds) {
      _data.read("checks", id, function (err, checkData) {
        if (!err && checkData) {
          // derive token from header
          let token =
            typeof data.header.token == "string" ? data.header.token : false;
          // verify that the given token is valid for thre specified phone number
          handlers._tokens.verifyToken(checkData.userPhone, token, function (
            tokenIsValid
          ) {
            if (tokenIsValid) {
              // update the object based on the optional data
              if (protocol) checkData.protocol = protocol;
              if (url) checkData.url = url;
              if (method) checkData.method = method;
              if (successCode) checkData.successCode = successCode;
              if (timeOutSeconds) checkData.timeOutSeconds = timeOutSeconds;
              _data.update("checks", id, checkData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { error: "could not update check" });
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, { error: "CheckId id not exist" });
        }
      });
    } else {
      callback(400, { error: "missing required field" });
    }
  } else {
    callback(400, { error: "missing required field" });
  }
};
// check-delete
// required:id
//optional:null
handlers._checks.DELETE = function (data, callback) {
  let id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  _data.read("checks", id, function (err, checkData) {
    if (!err && checkData) {
      // get token from header
      let token =
        typeof data.header.token == "string" ? data.header.token : false;
      // function call
      handlers._tokens.verifyToken(checkData.userPhone, token, function (
        tokenIsValid
      ) {
        if (tokenIsValid) {
          // remove hashed password before sending data to user
          _data.delete("checks", id, function (err) {
            if (!err) {
              _data.read("users", checkData.userPhone, function (
                err,
                userData
              ) {
                if (!err && userData) {
                  let userChecks =
                    typeof userData.checks == "object" &&
                    userData.checks instanceof Array
                      ? userData.checks
                      : [];
                  var checkPosition = userChecks.indexOf(id);
                  if (checkPosition > -1) {
                    userChecks.splice(checkPosition, 1);
                    _data.update(
                      "users",
                      checkData.userPhone,
                      userData,
                      function () {
                        if (!err) {
                          callback(200);
                        } else {
                          callback(500, {
                            error: "could not found check to delete in user",
                          });
                        }
                      }
                    );
                  }
                } else {
                  callback(500, {
                    error: "could not find the user who created the check",
                  });
                }
              });
            } else {
              callback(500, {
                error: "could not delete specified check",
              });
            }
          });
        } else {
          callback(400, { err: "could not find specified check" });
        }
      });
    } else {
      callback(400, { error: "missing required field" });
    }
  });
};

handlers.ping = function (data, callback) {
  callback(200);
};

handlers.notFound = function (data, callback) {
  callback(404);
};

// export the module
module.exports = handlers;
