import React from "react";
import { StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import {
  Action,
  StoreState,
  setConsent,
  setParentConsent,
  setName,
} from "../../../store";
import { format } from "date-fns";
import { ConsentInfo, ConsentInfoSignerType } from "audere-lib";
import { NavigationScreenProp } from "react-navigation";
import {
  AgeBucketConfig,
  BloodConfig,
  ConsentConfig,
  EnrolledConfig,
} from "../../../resources/ScreenConfig";
import ConsentChrome from "../../components/ConsentChrome";
import Description from "../../components/Description";
import SignatureInput from "../../components/SignatureInput";
import {
  getContactName,
  getContactPhone,
} from "../../../resources/LocationConfig";

interface Props {
  bloodCollection: boolean;
  consent?: ConsentInfo;
  parentConsent?: ConsentInfo;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  name: string;
  location: string;
  locationType: string;
}

@connect((state: StoreState) => ({
  bloodCollection: state.admin.bloodCollection,
  consent: state.form.consent,
  parentConsent: state.form.parentConsent,
  name: state.form.name,
  location: state.admin!.location,
  locationType: state.admin!.locationType,
}))
class ConsentScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps
> {
  _getConsentTerms = () => {
    const { t } = this.props;
    return !!this.props.locationType && this.props.locationType == "childcare"
      ? t("daycareFormText", {
          name: getContactName(this.props.location),
          phone: getContactPhone(this.props.location),
        })
      : t("consentFormText", {
          name: getContactName(this.props.location),
          phone: getContactPhone(this.props.location),
        });
  };

  _onSubmit = (
    participantName: string,
    signerType: ConsentInfoSignerType,
    signerName: string,
    signature: string,
    relation?: string
  ) => {
    const { t } = this.props;
    this.props.dispatch(setName(participantName));
    if (signerType === ConsentInfoSignerType.Parent) {
      this.props.dispatch(
        setParentConsent({
          name: signerName,
          terms: t("consentFormHeader") + "\n" + this._getConsentTerms(),
          signerType,
          date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
          signature,
        })
      );
    } else {
      this.props.dispatch(
        setConsent({
          name: signerName,
          terms: t("consentFormHeader") + "\n" + this._getConsentTerms(),
          signerType,
          date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
          signature,
          relation,
        })
      );
    }
    if (this._canProceed()) {
      this._proceed();
    }
  };

  _proceed = () => {
    if (
      this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) ===
        "18orOver" &&
      this.props.bloodCollection
    ) {
      this.props.navigation.push("Blood", {
        data: BloodConfig,
        reconsent: this.props.navigation.getParam("reconsent"),
      });
    } else if (
      this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "7to12"
    ) {
      this.props.navigation.push("Assent", {
        reconsent: this.props.navigation.getParam("reconsent"),
      });
    } else if (this.props.navigation.getParam("reconsent")) {
      this.props.navigation.push("Survey");
    } else {
      this.props.navigation.push("Enrolled", { data: EnrolledConfig });
    }
  };

  _canProceed = (): boolean => {
    if (
      this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) ===
      "18orOver"
    ) {
      return !!this.props.name && !!this.props.consent;
    } else if (
      this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "13to17"
    ) {
      return (
        !!this.props.name && !!this.props.consent && !!this.props.parentConsent
      );
    } else {
      return !!this.props.name && !!this.props.parentConsent;
    }
  };

  renderSignatures() {
    const { t } = this.props;
    if (
      this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) ===
      "18orOver"
    ) {
      return (
        <View>
          <View style={styles.signatureContainer}>
            <SignatureInput
              consent={this.props.consent}
              editableNames={true}
              participantName={this.props.name}
              signerType={ConsentInfoSignerType.Subject}
              onSubmit={this._onSubmit}
            />
            <SignatureInput
              consent={this.props.consent}
              editableNames={true}
              participantName={this.props.name}
              relation={
                !!this.props.consent ? this.props.consent.relation : undefined
              }
              signerType={ConsentInfoSignerType.Representative}
              signerName={
                !!this.props.consent &&
                this.props.consent.signerType ===
                  ConsentInfoSignerType.Representative
                  ? this.props.consent.name
                  : undefined
              }
              onSubmit={this._onSubmit}
            />
          </View>
          <Description
            content={t("whenSubjectUnable")}
            style={{ marginHorizontal: 20 }}
          />
        </View>
      );
    } else if (
      this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "13to17"
    ) {
      return (
        <View style={{ alignSelf: "stretch" }}>
          <View style={styles.signatureContainer}>
            <SignatureInput
              consent={this.props.consent}
              editableNames={true}
              participantName={this.props.name}
              signerType={ConsentInfoSignerType.Subject}
              onSubmit={this._onSubmit}
            />
            <SignatureInput
              consent={this.props.parentConsent}
              editableNames={true}
              participantName={this.props.name}
              signerType={ConsentInfoSignerType.Parent}
              signerName={
                this.props.parentConsent != null
                  ? this.props.parentConsent.name
                  : undefined
              }
              onSubmit={this._onSubmit}
            />
          </View>
          <Description
            content={t("subjectAndParent")}
            style={{ marginHorizontal: 20 }}
          />
        </View>
      );
    } else {
      return (
        <View style={{ alignSelf: "stretch" }}>
          <View style={styles.signatureContainer}>
            <SignatureInput
              consent={this.props.parentConsent}
              editableNames={true}
              participantName={this.props.name}
              signerType={ConsentInfoSignerType.Parent}
              signerName={
                this.props.parentConsent != null
                  ? this.props.parentConsent.name
                  : undefined
              }
              onSubmit={this._onSubmit}
            />
          </View>
        </View>
      );
    }
  }

  render() {
    const { t } = this.props;
    return (
      <ConsentChrome
        canProceed={this._canProceed()}
        progressNumber="60%"
        navigation={this.props.navigation}
        title={t("consent")}
        proceed={this._proceed}
        description={t(ConsentConfig.description!.label)}
        header={t("consentFormHeader")}
        terms={this._getConsentTerms()}
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

export default reduxWriter(withNamespaces("consentScreen")(ConsentScreen));
