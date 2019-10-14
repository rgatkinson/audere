import { Linking, Platform, PushNotificationIOS } from "react-native";
import PushNotification from "react-native-push-notification";
import { logFirebaseEvent, notificationEvent } from "./tracker";

export interface NotificationData {
  id: string;
  link?: string;
  referralId?: string;
}

export interface NotificationDateInterval {
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
}

export interface Notification {
  body: string;
  data: NotificationData;
  dateInterval: NotificationDateInterval;
  id: number; // Numeric id used on Android
}

export const notificationLaunchHandler = () => {
  if (Platform.OS == "ios") {
    PushNotificationIOS.getInitialNotification().then(notification => {
      if (notification != null) {
        notificationHandler(
          notification.getData() as NotificationData,
          /* initialLaunch */ true
        );
      }
    });
  } else {
    PushNotification.configure({
      onNotification: notification => {
        // @ts-ignore
        notificationHandler(notification.userInfo as NotificationData);
      },
      popInitialNotification: false,
      requestPermissions: false,
    });
  }
};

export const notificationHandler = (
  data: NotificationData,
  initialLaunch?: boolean
) => {
  logFirebaseEvent(notificationEvent, {
    appLaunch: !!initialLaunch,
    id: data.id,
    url: !!data.link ? data.link : "",
  });

  if (!!data.link) {
    const link = !!data.referralId
      ? `${data.link}?r=${data.referralId}`
      : data.link;
    Linking.openURL(link);
  }
};

export const getFireDate = (interval: NotificationDateInterval) => {
  const date = new Date();
  if (!!interval.seconds) {
    date.setSeconds(date.getSeconds() + interval.seconds);
  }
  if (!!interval.minutes) {
    date.setMinutes(date.getMinutes() + interval.minutes);
  }
  if (!!interval.hours) {
    date.setHours(date.getHours() + interval.hours);
  }
  if (!!interval.days) {
    date.setDate(date.getDate() + interval.days);
  }
  return date;
};
