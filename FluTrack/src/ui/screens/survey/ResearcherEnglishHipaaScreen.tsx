// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet } from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action, StoreState, setHipaaResearcherConsent } from "../../../store";
import {
  ConsentInfo,
  ConsentInfoSignerType,
} from "audere-lib/snifflesProtocol";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { NavigationScreenProp } from "react-navigation";
import { format } from "date-fns";
import {
  AgeBuckets,
  AgeBucketConfig,
  BloodConfig,
  EnrolledConfig,
} from "../../../resources/ScreenConfig";
import ConsentChrome from "../../components/ConsentChrome";
import SignatureInput from "../../components/SignatureInput";

interface Props {
  bloodCollection: boolean;
  hipaaResearcherConsent?: ConsentInfo;
  name: string;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

@connect((state: StoreState) => ({
  bloodCollection: state.admin.bloodCollection,
  hipaaResearcherConsent: state.form.hipaaResearcherConsent,
  name: state.form!.name,
}))
class ResearcherEnglishHipaaConsentScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _getHeader = () => {
    return this.props.t("hipaaConsentFormHeaderChildrens");
  };

  _getTerms = () => {
    return this.props.t("hipaaConsentFormTextChildrens");
  };

  _proceed = () => {
    this.props.i18n.changeLanguage("es");
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

  _willBlur: any;
  _willFocus: any;

  componentDidMount() {
    this._willBlur = this.props.navigation.addListener("willBlur", () =>
      this.props.i18n.changeLanguage("es")
    );

    this._willFocus = this.props.navigation.addListener("willFocus", () =>
      this.props.i18n.changeLanguage("en")
    );
  }

  componentWillUnmount() {
    if (this._willBlur != null) {
      this._willBlur.remove();
      this._willBlur = null;
    }

    if (this._willFocus != null) {
      this._willFocus.remove();
      this._willFocus = null;
    }
  }

  render() {
    const { i18n, t } = this.props;
    return (
      <ConsentChrome
        canProceed={!!this.props.hipaaResearcherConsent}
        progressNumber="75%"
        navigation={this.props.navigation}
        title={t("hipaaResearcherConsent")}
        header={this._getHeader()}
        terms={this._getTerms()}
        proceed={this._proceed}
      >
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
                localTime: format(new Date(), "HH:mm:ss"), // FHIR:time
                signature,
                relation,
              })
            );
          }}
        />
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
  withNamespaces("hipaaConsentScreen")(ResearcherEnglishHipaaConsentScreen)
);
