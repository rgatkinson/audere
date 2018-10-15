import uuidv4 from "uuid/v4";
import { AsyncStorage } from "react-native";
import axios from "axios";

const INTERACTION_QUEUE_KEY = "interaction.queue";
const DEVICE_ID = uuidv4();
const api = axios.create({
  baseURL: getApiBaseUrl(),
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

function getApiBaseUrl() {
  if (process.env.NODE_ENV === "development" && process.env.REACT_NATIVE_API_SERVER) {
    return process.env.REACT_NATIVE_API_SERVER;
  }
  return 'https://api.auderenow.io/api';
}

// api.interceptors.request.use(request => {
//   console.log('Starting Request', request);
//   return request;
// })

// api.interceptors.response.use(response => {
//   console.log('Response:', response);
//   return response;
// })

export async function logInteraction(data: string, count: number) {
  let item = {
    DeviceId: DEVICE_ID,
    Timestamp: new Date().toISOString(),
    Count: count,
    Extra: data
  };

  console.log("about to push " + data);
  let csrf = null;
  try {
    let response = await api.get("");
    csrf = response.data.CsrfToken;
    await api.post("button/", item, {
      headers: {
        "X-CSRFToken": csrf
      }
    });
  } catch (e) {
    console.log('================================');
    if (e.response) {
      console.log(e.response.data);
    }
    console.log(e);
    return;
  }

  // let json = await AsyncStorage.getItem(INTERACTION_QUEUE_KEY);

  // let list: [object] = typeof json === "string" ? JSON.parse(json) : [];
  // list.push(item);

  // await AsyncStorage.setItem(INTERACTION_QUEUE_KEY, JSON.stringify(list));

  // console.debug("Current documents:");
  // console.debug(JSON.stringify(list, null, 2));
}

function safeStr(s: string): string {
  return s.replace(/\W+/g, ".");
}
