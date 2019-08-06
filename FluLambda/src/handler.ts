// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import axios from "axios";

export const cronGet = async (event: any) => {
  try {
    axios.interceptors.request.use(request => {
      console.log(`Initiating request to ${request.url}`);
      return request;
    });

    axios.interceptors.response.use(response => {
      console.log(`Received response with status code ${response.status}`);
      return response;
    });

    const res = await axios.get(process.env.TARGET_URL, {
      timeout: +process.env.TIMEOUT || 5000,
    });

    return res.data;
  } catch (e) {
    console.log("Error occurred:");
    console.log(e.message);
    console.log(e.stack);
    throw e;
  }
};
