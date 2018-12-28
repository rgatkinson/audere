import React from "react";
import {
  ScrollView,
  StatusBar as SystemStatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Button from "./Button";
import Description from "./Description";
import StatusBar from "./StatusBar";

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
            <Description
              content={this.props.description}
              style={{ marginHorizontal: 20 }}
            />
          )}
          <Text style={[styles.consentText, { textAlign: "center" }]}>
            {this.props.header}
          </Text>
          <Text style={styles.consentText}>{this.props.terms}</Text>
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
    alignSelf: "stretch",
    backgroundColor: "white",
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    padding: 16,
  },
});

export default withNamespaces()(ConsentChrome);
