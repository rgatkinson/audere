#!/usr/bin/env ts-node
// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//
// Use "yarn unused-keys" for directions
// Does not account for generated keys from multiple variables for a single key
// Can pass over an unused key if its parent is used with different children and an identically
// named key is used in another file
// Prints out unused keys an extra time if both a key and its child(ren) not found

import fs from "fs";
import yargs from "yargs";

const argv: any = yargs.argv;

interface CheckDirArgs {
  enjson: string;
  searchDir: string;
}

function main(argv: CheckDirArgs) {
  try {
    let allFiles = getFiles(argv.searchDir, []);
    let allPotentialKeys = new Set();
    allFiles.forEach(indivFile => {
      let singleFile = fs.readFileSync(indivFile, "utf8");
      let textByQuote = singleFile.split('"');
      for (let ii = 1; ii < textByQuote.length; ii += 2) {
        let indivKeys = textByQuote[ii].split(":");
        for (let jj = 0; jj < indivKeys.length; jj++) {
          allPotentialKeys.add(indivKeys[jj]);
        }
      }
    });
    let jsonFile = fs.readFileSync(argv.enjson);
    let keys = getKeys(JSON.parse(jsonFile.toString()));
    let unusedKeys = new Array<string>();
    keys.forEach(key => {
      if (!allPotentialKeys.has(key) && !key.includes("++")) {
        unusedKeys.push(key);
      }
    });
    printKeys(JSON.parse(jsonFile.toString()), unusedKeys);
  } catch (e) {
    console.log("Error:", e.stack);
    console.log(
      '\nSomething went wrong, make sure the command is formatted as follows: “yarn unused-keys --enjson=[PATH TO EN.JSON] --searchDir=[PATH TO SEARCH DIRECTORY]"\n'
    );
  }
}

const EMPTY_SET = new Set<string>();

function getKeys(jsonObject: any): Set<string> {
  if (typeof jsonObject !== "object") {
    return EMPTY_SET;
  }
  let keys = Object.keys(jsonObject);
  let allKeys = new Set("");
  keys.forEach((key: string) => {
    allKeys.add(key);
    let jsonKey = getKeys(jsonObject[key]);
    jsonKey.forEach(allKeys.add, allKeys);
  });
  return allKeys;
}

function getFiles(dir: string, files_: Array<string>) {
  let files = fs.readdirSync(dir);
  for (let i in files) {
    let name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else if (name.match(/\.ts|\.tsx/)) {
      files_.push(name);
    }
  }
  return files_;
}

function printKeys(jsonObject: any, unusedKeys: Array<string>) {
  const keyPaths = getKeyPaths(jsonObject);
  unusedKeys.forEach((unusedKey: string) => {
    keyPaths.forEach((keyPath: string) => {
      const keyParts = keyPath.split(";");
      if (keyParts.indexOf(unusedKey) > -1) {
        console.log(keyPath.split(";").join("."));
      }
    });
  });
}

function getKeyPaths(jsonObject: any): Array<string> {
  if (typeof jsonObject !== "object") {
    return new Array(jsonObject);
  }
  const keys = Object.keys(jsonObject);
  let allKeys = new Array<string>();
  keys.forEach((key: string) => {
    if (typeof jsonObject[key] === "object") {
      const jsonKey = getKeyPaths(jsonObject[key]);
      jsonKey.forEach((innerKey: string) => {
        allKeys.push(key + ";" + innerKey);
      });
    } else {
      allKeys.push(key);
    }
  });
  return allKeys;
}

if ("enjson" in argv && "searchDir" in argv) {
  main(argv);
} else {
  console.log(
    "For this command, use “yarn unused-keys --enjson=[PATH TO EN.JSON] --searchDir=[PATH TO SEARCH DIRECTORY]\" \nThis checks .ts or .tsx files in the searchDir for the given enjson's keys, printing out the enjson keys that aren't found."
  );
}
