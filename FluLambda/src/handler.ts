// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const axios = require("axios");

export const cronGet = async (event: any) => {
  try {
    const res = await axios.get(process.env.TARGET_URL);
    console.log(JSON.stringify(res.data));
    return res.data;
  } catch(e) {
    console.log("Error occurred:");
    console.log(e.message);
    console.log(e.stack);
    throw e;
  }
};
