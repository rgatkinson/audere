import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { AgeBucketConfig, BloodConfig, ConsentConfig, EnrolledConfig } from "../../../resources/ScreenConfig";
import Button from "../../components/Button";
import Description from "../../components/Description";
import SignatureInput from "../../components/SignatureInput";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";
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
  signerName: string;
  signerType: ConsentInfoSignerType,
}

@connect((state: StoreState) => ({
  bloodCollection: state.admin.bloodCollection,
  consent: state.form.consent,
  parentConsent: state.form.parentConsent,
  name: state.form.name,
  location: state.admin!.location,
  locationType: state.admin!.locationType,
  signerName: state.form.consent != null ? state.form.consent.name : undefined,
  signerType: state.form.consent != null ? state.form.consent.signerType : undefined,
}))
class ConsentScreen extends React.Component<Props & WithNamespaces & ReduxWriterProps> {
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

  _onSubmit = (participantName: string, signerType: ConsentInfoSignerType, signerName: string, signature: string) => {
    const { t } = this.props;
    this.props.dispatch(setName(participantName));
    if (signerType === ConsentInfoSignerType.Parent) {
      this.props.dispatch(setParentConsent({
        name: signerName,
        terms: t("consentFormHeader") + "\n" + this._getConsentTerms(),
        signerType, 
        date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
        signature,
      }));
    } else {
      this.props.dispatch(setConsent({
        name: signerName,
        terms: t("consentFormHeader") + "\n" + this._getConsentTerms(),
        signerType, 
        date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
        signature,
      }));
    }
  }

  _proceed = () =>{
    if (this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "18orOver" &&
        this.props.bloodCollection) {
        this.props.navigation.push("Blood", { data: BloodConfig, reconsent: this.props.navigation.getParam("reconsent") });
    } else if (this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "7to12") {
      this.props.navigation.push("Assent", { reconsent: this.props.navigation.getParam("reconsent") });
    } else if (this.props.navigation.getParam("reconsent")) {
      this.props.navigation.push("Survey");
    } else {
      this.props.navigation.push("Enrolled", { data: EnrolledConfig });
    }
  };

  _canProceed = (): boolean => {
    if (this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "18orOver") {
      return !!this.props.name && !!this.props.consent;
    } else if (this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "13to17") {
      return !!this.props.name && !!this.props.consent && !!this.props.parentConsent;
    } else {
      return !!this.props.name && !!this.props.parentConsent;
    }
  }

  renderSignatures() {
    const { t } = this.props;
    if (this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "18orOver") {
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
              signerType={ConsentInfoSignerType.Representative}
              signerName={this.props.signerType === ConsentInfoSignerType.Representative ? this.props.signerName : undefined}
              onSubmit={this._onSubmit}
            />
          </View>
          <Description content={t("whenSubjectUnable")} style={{ marginHorizontal: 20 }}/>
        </View>
      );
    } else if (this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "13to17") {
      return (
        <View style={{ alignSelf: 'stretch' }}>
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
              signerName={this.props.parentConsent != null ? this.props.parentConsent.name : undefined}
              onSubmit={this._onSubmit}
            />
          </View>
          <Description content={t("subjectAndParent")} style={{ marginHorizontal: 20 }}/>
        </View>
      );
    } else {
      return (
        <View style={{ alignSelf: 'stretch' }}>
          <View style={styles.signatureContainer}>
            <SignatureInput
              consent={this.props.parentConsent}
              editableNames={true}
              participantName={this.props.name}
              signerType={ConsentInfoSignerType.Parent}
              signerName={this.props.parentConsent != null ? this.props.parentConsent.name : undefined}
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
      <View style={styles.container}>
        <StatusBar
          canProceed={this._canProceed()}
          progressNumber="60%"
          progressLabel={t("common:statusBar:enrollment")}
          title={t("consent")}
          onBack={this.props.navigation.pop}
          onForward={this._proceed}
        />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Description content={t(ConsentConfig.description!.label)} style={{ marginHorizontal: 20 }} />
          <Text style={[styles.consentText, {textAlign: 'center'}]}>
            {t("consentFormHeader")}
          </Text>
          <Text style={styles.consentText}>
            {this._getConsentTerms()}
          </Text>
          {this.renderSignatures()}
          <Button
            enabled={this._canProceed()}
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
  signatureContainer: {
    alignSelf: 'stretch',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default reduxWriter(withNamespaces("consentScreen")(ConsentScreen));
