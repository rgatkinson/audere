#!/usr/bin/env ts-node
// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.
//
// Command of 'unused-keys' to use
// Input takes an 'enjson' and a 'searchDir', both with filepath values
// Checks all .ts or .tsx files in the searchDir for all enjson keys, printing out
// the enjson keys that aren't found
// Does not account for generated keys from multiple variables for a single key
// (ie in DidYouKnow.tsx tip + #)

import fs from "fs";
import yargs from "yargs";

const argv: any = yargs.argv;

interface CheckDirArgs {
  enjson: string;
  searchDir: string;
}

function main(argv: CheckDirArgs) {
  let allFiles = getFiles(argv.searchDir, []);
  let allPotentialKeys = new Set();
  allFiles.forEach(indivFile => {
    try {
      let singleFile = fs.readFileSync(indivFile, "utf8");
      let textByQuote = singleFile.split('"');
      for (let ii = 1; ii < textByQuote.length; ii += 2) {
        let indivKeys = textByQuote[ii].split(":");
        for (let jj = 0; jj < indivKeys.length; jj++) {
          allPotentialKeys.add(indivKeys[jj]);
        }
      }
    } catch (e) {
      console.log("Error:", e.stack);
    }
  });
  try {
    let jsonFile = fs.readFileSync(argv.enjson);
    let keys = getKeys(JSON.parse(jsonFile.toString()));
    keys.forEach(key => {
      if (!allPotentialKeys.has(key) && !key.includes("++")) {
        console.log(key);
      }
    });
  } catch (e) {
    console.log("Error:", e.stack);
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

main(argv);
