import axios from "axios";
import { Constants } from "expo";
import { getApiBaseUrl } from "../transport";

export async function getDeviceSetting(key: string) {
  try {
    const response = await axios.get(
      `${getApiBaseUrl()}/settings/${Constants.installationId}/${key}`
    );
    if (response.status === 200) {
      return response.data;
    }
  } catch (e) {
    // Expected most of the time
  }
  return null;
}
