import React from "react";
import { StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  Action,
  StoreState,
  setHipaaConsent,
  setHipaaResearcherConsent,
} from "../../../store";
import { ConsentInfo, ConsentInfoSignerType } from "audere-lib";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { NavigationScreenProp } from "react-navigation";
import { format } from "date-fns";
import {
  AgeBuckets,
  AgeBucketConfig,
  BloodConfig,
  HipaaConfig,
  EnrolledConfig,
} from "../../../resources/ScreenConfig";
import ConsentChrome from "../../components/ConsentChrome";
import SignatureInput from "../../components/SignatureInput";

interface Props {
  bloodCollection: boolean;
  consent?: ConsentInfo;
  hipaaConsent?: ConsentInfo;
  hipaaResearcherConsent?: ConsentInfo;
  locationType: string;
  name: string;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

@connect((state: StoreState) => ({
  bloodCollection: state.admin.bloodCollection,
  consent: !!state.form.parentConsent
    ? state.form.parentConsent
    : state.form.consent,
  hipaaConsent: state.form.hipaaConsent,
  hipaaResearcherConsent: state.form.hipaaResearcherConsent,
  locationType: state.admin!.locationType,
  name: state.form!.name,
}))
class HipaaConsentScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _getHeader = () => {
    const { t, locationType } = this.props;
    if (locationType == "hospital") {
      return t("hipaaConsentFormHeaderUW");
    }
    return t("hipaaConsentFormHeaderChildrens");
  };

  _getTerms = () => {
    const { t, locationType } = this.props;
    if (locationType == "hospital") {
      return t("hipaaConsentFormTextUW");
    }
    return t("hipaaConsentFormTextChildrens");
  };

  _proceed = () => {
    const ageBucket = this.props.getAnswer(
      "selectedButtonKey",
      AgeBucketConfig.id
    );
    if (ageBucket === AgeBuckets.Over18 && this.props.bloodCollection) {
      this.props.navigation.push("Blood", { data: BloodConfig });
    } else if (ageBucket === AgeBuckets.Child) {
      this.props.navigation.push("Assent");
    } else {
      this.props.navigation.push("Enrolled", { data: EnrolledConfig });
    }
  };

  renderSignatures() {
    const participantSig = (
      <SignatureInput
        consent={this.props.hipaaConsent}
        editableNames={false}
        participantName={this.props.name}
        relation={this.props.consent ? this.props.consent.relation : undefined}
        signerType={
          this.props.consent
            ? this.props.consent.signerType
            : ConsentInfoSignerType.Subject
        }
        signerName={this.props.consent ? this.props.consent.name : undefined}
        onSubmit={(
          participantName: string,
          signerType: ConsentInfoSignerType,
          signerName: string,
          signature: string,
          relation?: string
        ) => {
          this.props.dispatch(
            setHipaaConsent({
              name: signerName,
              terms: this._getHeader() + "\n" + this._getTerms(),
              signerType,
              date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
              signature,
              relation,
            })
          );
        }}
      />
    );

    if (this.props.locationType == "hospital") {
      return participantSig;
    } else {
      return (
        <View style={styles.signatureContainer}>
          {participantSig}
          <SignatureInput
            consent={this.props.hipaaResearcherConsent}
            editableNames={true}
            participantName={this.props.name}
            signerType={ConsentInfoSignerType.Researcher}
            onSubmit={(
              participantName: string,
              signerType: ConsentInfoSignerType,
              signerName: string,
              signature: string,
              relation?: string
            ) => {
              this.props.dispatch(
                setHipaaResearcherConsent({
                  name: signerName,
                  terms: this._getHeader() + "\n" + this._getTerms(),
                  signerType,
                  date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
                  signature,
                  relation,
                })
              );
            }}
          />
        </View>
      );
    }
  }

  render() {
    const { t, locationType } = this.props;
    return (
      <ConsentChrome
        canProceed={
          !!this.props.hipaaConsent &&
          (locationType == "hospital" || !!this.props.hipaaResearcherConsent)
        }
        progressNumber="70%"
        navigation={this.props.navigation}
        title={t(HipaaConfig.title)}
        proceed={this._proceed}
        header={this._getHeader()}
        terms={this._getTerms()}
      >
        {this.renderSignatures()}
      </ConsentChrome>
    );
  }
}

const styles = StyleSheet.create({
  signatureContainer: {
    alignSelf: "stretch",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default reduxWriter(
  withNamespaces("hipaaConsentScreen")(HipaaConsentScreen)
);
