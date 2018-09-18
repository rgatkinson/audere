import { AsyncStorage } from "react-native";

const INTERACTION_QUEUE_KEY = 'interaction.queue';

export async function logInteraction(data: object) {
  let item = {
    timestamp: new Date().toISOString(),
    data,
  };

  let json = await AsyncStorage.getItem(INTERACTION_QUEUE_KEY);

  let list: [object] = typeof json === "string" ? JSON.parse(json) : [];
  list.push(item);

  await AsyncStorage.setItem(INTERACTION_QUEUE_KEY, JSON.stringify(list));

  console.debug("Current documents:");
  console.debug(JSON.stringify(list, null, 2));
}

function safeStr(s: string): string {
  return s.replace(/\W+/g, ".");
}
