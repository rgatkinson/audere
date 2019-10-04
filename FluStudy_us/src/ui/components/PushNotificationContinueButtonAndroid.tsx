// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  withNavigation,
  NavigationScreenProp,
  StackActions,
} from "react-navigation";
import { connect } from "react-redux";
import PushNotification from "react-native-push-notification";
import { setScheduledSurveyNotif, Action, StoreState } from "../../store";
import {
  Notification,
  getFireDate,
  notificationHandler,
} from "../../util/notifications";
import Button from "./Button";
import { getRemoteConfig } from "../../util/remoteConfig";

interface Props {
  barcode?: string;
  navigation: NavigationScreenProp<any, any>;
  notification: Notification;
  next: string;
  scheduledSurveyNotif: boolean;
  dispatch(action: Action): void;
}

class PushNotificationContinueButtonAndroid extends React.Component<
  Props & WithNamespaces
> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return false;
  }

  _onNext = () => {
    this._scheduleNotification();
  };

  _scheduleNotification = () => {
    const {
      barcode,
      navigation,
      notification,
      next,
      scheduledSurveyNotif,
      t,
      dispatch,
    } = this.props;
    if (
      !scheduledSurveyNotif &&
      false /*!getRemoteConfig("skipSurveyNotification")*/
    ) {
      PushNotification.cancelLocalNotifications({
        id: notification.id.toString(),
      });
      PushNotification.localNotificationSchedule({
        date: getFireDate(notification.dateInterval),
        id: notification.id.toString(),
        message: t(notification.body),
        userInfo: { ...notification.data, referralId: barcode },
      });
      dispatch(setScheduledSurveyNotif());
    }
    navigation.dispatch(StackActions.push({ routeName: next }));
  };

  render() {
    const { t } = this.props;
    return (
      <Button
        enabled={true}
        label={t("common:button:continue")}
        primary={true}
        onPress={this._onNext}
      />
    );
  }
}

export default connect((state: StoreState) => ({
  barcode: state.survey.kitBarcode ? state.survey.kitBarcode.code : undefined,
  scheduledSurveyNotif: state.meta.scheduledSurveyNotif,
}))(
  withNavigation(
    withNamespaces("PushNotifications")(PushNotificationContinueButtonAndroid)
  )
);
