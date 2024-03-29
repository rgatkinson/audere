// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import {
  BloodConfig,
  ConsentConfig,
  EnrolledConfig,
} from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Text from "../../components/Text";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class BloodScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _onDone = (key: string) => {
    this.props.updateAnswer({ selectedButtonKey: key });
    this._proceed(key);
  };

  _proceed = (key: string) => {
    if (key === "yes") {
      this.props.navigation.push("BloodConsent");
    } else {
      this.props.navigation.push("Enrolled", { data: EnrolledConfig });
    }
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={!!this.props.getAnswer("selectedButtonKey")}
          progressNumber="80%"
          progressLabel={t("common:statusBar:enrollment")}
          title={t("optIn")}
          onBack={() => this.props.navigation.pop()}
          onForward={() => {
            this._proceed(this.props.getAnswer("selectedButtonKey"));
          }}
        />
        <ContentContainer>
          <Title label={t("surveyTitle:" + BloodConfig.title)} />
          <Text
            content={t("surveyDescription:" + BloodConfig.description!.label)}
          />
          {BloodConfig.buttons.map(button => (
            <Button
              checked={this.props.getAnswer("selectedButtonKey") === button.key}
              enabled={true}
              key={button.key}
              label={t("surveyButton:" + button.key)}
              subtext={t(button.subtextKey)}
              onPress={() => {
                this._onDone(button.key);
              }}
              primary={button.primary}
            />
          ))}
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default reduxWriter(withNamespaces("bloodScreen")(BloodScreen));
