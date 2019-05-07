// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  ScrollView,
  StatusBar as SystemStatusBar,
  StyleSheet,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Button from "./Button";
import StatusBar from "./StatusBar";
import Text from "./Text";

interface Props {
  canProceed: boolean;
  progressNumber: string;
  title: string;
  navigation: NavigationScreenProp<any, any>;
  description?: string;
  header: string;
  terms: string;
  children: any;
  proceed(): void;
}

class ConsentChrome extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <SystemStatusBar barStyle="dark-content" />
        <StatusBar
          canProceed={this.props.canProceed}
          progressNumber={this.props.progressNumber}
          progressLabel={t("common:statusBar:enrollment")}
          title={this.props.title}
          onBack={this.props.navigation.pop}
          onForward={this.props.proceed}
        />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {!!this.props.description && (
            <Text
              content={this.props.description}
              style={{ marginHorizontal: 20 }}
            />
          )}
          <Text
            center={true}
            content={this.props.header}
            style={styles.consentText}
          />
          <Text content={this.props.terms} style={styles.consentText} />
          {this.props.children}
          <Button
            enabled={this.props.canProceed}
            label={t("surveyButton:done")}
            primary={true}
            onPress={this.props.proceed}
          />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
  },
  consentText: {
    backgroundColor: "white",
    fontSize: 16,
    marginVertical: 0,
    padding: 16,
  },
});

export default withNamespaces()(ConsentChrome);
