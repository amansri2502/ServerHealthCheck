//lib for storing and editing data

const fs = require("fs");
const path = require("path");
const helpers = require("./helper");

// container for the module to be exported

let lib = {};

//base directory of the datafolder
lib.baseDir = path.join(__dirname, "/../.data/");

//write data to the file

lib.create = function (dir, file, data, callback) {
  // open the file for writing

  fs.open(lib.baseDir + dir + "/" + file + ".json", "wx", function (
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      // convert data into string
      let stringData = JSON.stringify(data);

      // write to file and close it
      fs.writeFile(fileDescriptor, stringData, function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback("error in closing file");
            }
          });
        } else {
          callback("error in writting to the file");
        }
      });
    } else {
      callback("error in creating new file may already exist");
    }
  });
};

// read data from a file
lib.read = function (dir, file, callback) {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "UTF-8", function (
    err,
    data
  ) {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

//update a existing file
lib.update = function (dir, file, data, callback) {
  fs.open(lib.baseDir + dir + "/" + file + ".json", "r+", function (
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      // converting data to string
      let stringData = JSON.stringify(data);

      // truncating data in the file
      fs.ftruncate(fileDescriptor, function (err) {
        if (!err) {
          // write to file
          fs.writeFile(fileDescriptor, stringData, function (err) {
            if (!err) {
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  callback(false);
                } else {
                  callback("error closing file");
                }
              });
            } else {
              callback("error writting file");
            }
          });
        } else {
          callback("error in truncating");
        }
      });
    } else {
      callback("error in opening file");
    }
  });
};

lib.delete = function (dir, file, callback) {
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", function (err) {
    if (!err) {
      callback(false);
    } else {
      callback("not able to delete");
    }
  });
};
// export the module
module.exports = lib;
