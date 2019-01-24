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
  AgeBuckets,
  AgeBucketConfig,
  BloodConfig,
  ConsentConfig,
  EnrolledConfig,
  HipaaConfig,
} from "../../../resources/ScreenConfig";
import ConsentChrome from "../../components/ConsentChrome";
import SignatureInput from "../../components/SignatureInput";
import Text from "../../components/Text";
import {
  getContactName,
  getContactPhone,
} from "../../../resources/LocationConfig";

interface Props {
  bloodCollection: boolean;
  consent?: ConsentInfo;
  parentConsent?: ConsentInfo;
  location: string;
  locationType: string;
  name: string;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
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
    return t("consentFormText", {
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

  _getAgeBucket = () => {
    if (this.props.navigation.getParam("reconsent")) {
      return this.props.navigation.getParam("newAgeBucket");
    }
    return this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id);
  };

  _proceed = () => {
    const { locationType } = this.props;
    if (
      locationType == "hospital" ||
      locationType == "childrensHospital" ||
      locationType == "childrensClinic" ||
      locationType == "childcare"
    ) {
      this.props.navigation.push("Hipaa");
    } else if (
      this._getAgeBucket() === AgeBuckets.Over18 &&
      this.props.bloodCollection
    ) {
      this.props.navigation.push("Blood", { data: BloodConfig });
    } else if (this._getAgeBucket() === AgeBuckets.Child) {
      this.props.navigation.push("Assent");
    } else {
      this.props.navigation.push("Enrolled", { data: EnrolledConfig });
    }
  };

  _canProceed = (): boolean => {
    if (this._getAgeBucket() === AgeBuckets.Over18) {
      return !!this.props.name && !!this.props.consent;
    } else if (this._getAgeBucket() === AgeBuckets.Teen) {
      return (
        !!this.props.name && !!this.props.consent && !!this.props.parentConsent
      );
    } else {
      return !!this.props.name && !!this.props.parentConsent;
    }
  };

  renderSignatures() {
    const { t } = this.props;
    if (this._getAgeBucket() === AgeBuckets.Over18) {
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
          <Text
            content={t("whenSubjectUnable")}
            style={{ marginHorizontal: 20 }}
          />
        </View>
      );
    } else if (this._getAgeBucket() === AgeBuckets.Teen) {
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
          <Text
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
