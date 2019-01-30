// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Option } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import NavigationBar from "../../components/NavigationBar";
import OptionList, {
  newSelectedOptionsList,
} from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import Step from "../../components/Step";
import Text from "../../components/Text";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

@connect()
class ConsentScreen extends React.PureComponent<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={{ flex: 1 }}>
        <NavigationBar
          canProceed={false}
          navigation={this.props.navigation}
          onNext={() => {}}
        />
        <Step step={3} totalSteps={5} />
        <Title label={t("consent")} />
        <Text content={t("description")} center={true} />
        <View style={{ flex: 1 }}>
          <ScrollView>
            <Text
              center={true}
              content={t("consentFormHeader")}
              style={styles.consentText}
            />
            <Text content={t("consentFormText")} style={styles.consentText} />
            <Button
              enabled={true}
              primary={true}
              label={t("accept")}
              onPress={() => {
                this.props.navigation.push("Address");
              }}
            />
          </ScrollView>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  consentText: {
    backgroundColor: "white",
    fontSize: 16,
    marginVertical: 0,
    padding: 16,
  },
});

export default withNamespaces("consentScreen")(ConsentScreen);
