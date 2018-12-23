import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  Action,
  StoreState,
  setBloodConsent,
} from "../../../store";
import { ConsentInfo, ConsentInfoSignerType } from "audere-lib";
import { NavigationScreenProp } from "react-navigation";
import { format } from "date-fns";
import { BloodConsentConfig, EnrolledConfig } from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import Description from "../../components/Description";
import SignatureInput from "../../components/SignatureInput";
import StatusBar from "../../components/StatusBar";

interface Props {
  bloodConsent?: ConsentInfo;
  consent: ConsentInfo;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  name: string;
  signerName: string;
  signerType: ConsentInfoSignerType,
}

@connect((state: StoreState) => ({
  bloodConsent: state.form.bloodConsent,
  consent: state.form.consent,
  name: state.form!.name,
}))
class BloodConsentScreen extends React.Component<Props & WithNamespaces> {

  _onSubmit = (participantName: string, signerType: ConsentInfoSignerType, signerName: string, signature: string) => {
    this.props.dispatch(setBloodConsent({
      name: signerName,
      terms: this.props.t("bloodFormText"),
      signerType, 
      date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
      signature,
    }));
  };

  _proceed = () => {
    this.props.navigation.push("Enrolled", { data: EnrolledConfig });
  }

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <StatusBar
          canProceed={!!this.props.bloodConsent}
          progressNumber="90%"
          progressLabel={t("common:statusBar:enrollment")}
          title={t(BloodConsentConfig.title)}
          onBack={() => this.props.navigation.pop()}
          onForward={this._proceed}
        />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Description content={t(BloodConsentConfig.description!.label)} style={{ marginHorizontal: 20 }} />
          <Text style={[styles.consentText, {textAlign: 'center'}]}>
            {t("bloodConsentFormHeader")}
          </Text>
          <Text style={styles.consentText}>
            {this.props.t("bloodFormText")}
          </Text>
          <SignatureInput
            consent={this.props.bloodConsent}
            editableNames={false}
            participantName={this.props.name}
            signerType={this.props.consent.signerType}
            signerName={this.props.consent.name}
            onSubmit={this._onSubmit}
          />
          <Button
            enabled={!!this.props.bloodConsent}
            label={t("surveyButton:done")}
            primary={true}
            onPress={this._proceed}
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
    alignItems: 'center',
  },
  consentText: {
    alignSelf: 'stretch',
    backgroundColor: 'white',
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    padding: 16,
  },

  input: {
    marginHorizontal: 30,
  },
  textContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 30,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  dateText: {
    color: "#8E8E93",
  },
  text: {
    alignSelf: "stretch",
    fontSize: 20,
  },
});

export default withNamespaces("bloodConsentScreen")<Props>(BloodConsentScreen);
