// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { PushNotificationIOS, PushNotificationPermissions } from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { format } from "date-fns";
import {
  PushNotificationState,
  PushRegistrationError,
} from "audere-lib/chillsProtocol";
import {
  setScheduledSurveyNotif,
  setPushNotificationState,
  Action,
  StoreState,
} from "../../store";
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
  pushState: PushNotificationState;
  scheduledSurveyNotif: boolean;
  dispatch(action: Action): void;
}

interface State {
  canAlert: boolean;
}

class PushNotificationContinueButtonIOS extends React.Component<
  Props & WithNamespaces
> {
  state = {
    canAlert: false,
  };

  constructor(props: Props & WithNamespaces) {
    super(props);
    PushNotificationIOS.checkPermissions(this._updatePermissions);
  }

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return false;
  }

  _didFocus: any;
  _willBlur: any;

  componentDidMount() {
    const { navigation } = this.props;
    this._didFocus = navigation.addListener("didFocus", () => {
      PushNotificationIOS.addEventListener("register", this._regEvent);
      PushNotificationIOS.addEventListener(
        "registrationError",
        this._regErrorEvent
      );
      PushNotificationIOS.removeEventListener(
        "localNotification",
        this._handleNotification
      );
      PushNotificationIOS.addEventListener(
        "localNotification",
        this._handleNotification
      );
    });
    this._willBlur = navigation.addListener("willBlur", () => {
      PushNotificationIOS.removeEventListener("register", this._regEvent);
      PushNotificationIOS.removeEventListener(
        "registrationError",
        this._regErrorEvent
      );
    });
  }

  componentWillUnmount() {
    this._didFocus.remove();
    this._willBlur.remove();
  }

  _updatePermissions = (permissions: PushNotificationPermissions) => {
    this.setState({ canAlert: permissions.alert });
  };

  _regEvent = (token: string) => {
    if (this.state.canAlert) {
      const { dispatch, pushState } = this.props;
      const newPushState = { ...pushState, token };
      dispatch(setPushNotificationState(newPushState));
    }
    this._scheduleNotification();
  };

  _regErrorEvent = (registrationError: PushRegistrationError) => {
    const { dispatch, pushState } = this.props;
    const newPushState = { ...pushState, registrationError };
    dispatch(setPushNotificationState(newPushState));
    this._scheduleNotification();
  };

  _onNext = () => {
    if (!this.state.canAlert && !this.props.pushState.showedSystemPrompt) {
      const { dispatch, pushState } = this.props;
      const newPushState = {
        ...pushState,
        showedSystemPrompt: true,
      };
      dispatch(setPushNotificationState(newPushState));
      // @ts-ignore
      PushNotificationIOS.requestPermissions().then(
        (permissions: PushNotificationPermissions) => {
          this._updatePermissions(permissions);
        }
      );
    } else {
      this._scheduleNotification();
    }
  };

  _scheduleNotification = () => {
    const {
      barcode,
      navigation,
      next,
      notification,
      scheduledSurveyNotif,
      t,
      dispatch,
    } = this.props;

    if (
      !scheduledSurveyNotif &&
      false /*!getRemoteConfig("skipSurveyNotification")*/
    ) {
      PushNotificationIOS.cancelLocalNotifications({
        id: notification.data.id,
      });
      PushNotificationIOS.scheduleLocalNotification({
        // @ts-ignore
        fireDate: format(
          getFireDate(notification.dateInterval),
          "YYYY-MM-DDTHH:mm:ss.sssZ"
        ),
        alertAction: "view",
        alertBody: t(notification.body),
        userInfo: { ...notification.data, referralId: barcode },
      });
      dispatch(setScheduledSurveyNotif());
    }

    navigation.push(next);
  };

  _handleNotification = () => {
    const { notification } = this.props;
    notificationHandler(notification.data);
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
  pushState: state.survey.pushState,
  scheduledSurveyNotif: state.meta.scheduledSurveyNotif,
}))(
  withNavigation(
    withNamespaces("PushNotifications")(PushNotificationContinueButtonIOS)
  )
);
