// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

const axios = require("axios");

export const hutchUpload = async (event) => {
  try {
    const requestUrl = process.env.FLU_SERVICE_UPLOAD_PATH;
    const res = await axios.get(requestUrl);
    
    const sent = res.data.sent;
    if (sent.length > 0) {
      console.log(sent.length + " records sent: " + sent);
    }

    const erred = res.data.erred;
    if (erred.length > 0) {
      console.log(erred.length + " records not sent: " + erred);
    }
    
    return sent.length;
  } catch(e) {
    console.log("Error occurred:");
    console.log(e.message);
    console.log(e.stack);
    throw e;
  }
};
