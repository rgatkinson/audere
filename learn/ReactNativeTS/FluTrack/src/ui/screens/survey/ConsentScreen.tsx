import React from "react";
import {
  KeyboardAvoidingView,
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
  setName,
  setSignaturePng,
  setConsentTerms,
} from "../../../store";
import { NavigationScreenProp } from "react-navigation";
import { format } from "date-fns";
import { AgeBucketConfig, BloodConfig, ConsentConfig, EnrolledConfig } from "../../../resources/ScreenConfig";
import Description from "../../components/Description";
import SignatureBox from "../../components/SignatureBox";
import StatusBar from "../../components/StatusBar";
import TextInput from "../../components/TextInput";
import Title from "../../components/Title";
import {
  getContactName,
  getContactPhone,
} from "../../../resources/LocationConfig";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  name: string;
  location: string;
  locationType: string;
  signature: string;
}

interface State {
  name?: string;
}

@connect((state: StoreState) => ({
  name: state.form!.name,
  location: state.admin!.location,
  locationType: state.admin!.locationType,
  signature: state.form!.signatureBase64,
}))
class ConsentScreen extends React.Component<Props & WithNamespaces & ReduxWriterProps, State> {
  state: State = {};

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

  _onSubmit = (signature: string | undefined) => {
    if (!!this.state.name) {
      this.props.dispatch(setName(this.state.name));
    }
    this.props.dispatch(setConsentTerms(this._getConsentTerms()));
    if (!!signature) {
      this.props.dispatch(setSignaturePng(signature));
    }

    if (this.props.navigation.getParam("reconsent")) {
      this.props.navigation.push("Survey");
    } else if (this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id) === "18orOver" &&
        this.props.getAnswer("selectedButtonKey", BloodConfig.id) === "yes") {
      this.props.navigation.push("BloodConsent", { priorTitle: this.props.t(ConsentConfig.title) });
    } else {
      this.props.navigation.push("Enrolled", { data: EnrolledConfig });
    }
  };

  _getName = (): string => {
    return typeof this.state.name !== 'undefined' ? this.state.name : this.props.name;
  }

  render() {
    const { t } = this.props;
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        <StatusBar
          canProceed={!!this._getName() && !!this.props.signature && !this.props.navigation.getParam("reconsent")}
          progressNumber="80%"
          progressLabel={t("common:statusBar:enrollment")}
          title={this.props.navigation.getParam("priorTitle")}
          onBack={this.props.navigation.pop}
          onForward={this._onSubmit}
        />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Title label={t(ConsentConfig.title)} />
          <Description content={t(ConsentConfig.description!.label)} />
          <Text>
            {this._getConsentTerms()}
          </Text>
        </ScrollView>
        <View style={styles.input}>
          <View style={styles.dateContainer}>
            <Text style={styles.text}>{t("todaysDate")}</Text>
            <Text style={[styles.text, styles.dateText]}>
              {format(new Date(), "MM/D/YYYY")}
            </Text>
          </View>
          <TextInput
            autoFocus={false}
            placeholder={t("fullName")}
            returnKeyType="done"
            value={this._getName()}
            onChangeText={text => this.setState({ name: text })}
          />
        </View>
        <SignatureBox
          canSubmit={!!this.state.name}
          onSubmit={(signature: string) => {
            this._onSubmit(signature);
          }}
        />
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    marginHorizontal: 20,
  },
  input: {
    marginHorizontal: 30,
  },
  dateContainer: {
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

export default reduxWriter(withNamespaces("consentScreen")(ConsentScreen));
