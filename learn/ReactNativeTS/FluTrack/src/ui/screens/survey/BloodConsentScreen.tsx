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
import {
  Action,
  StoreState,
  setBloodSignaturePng,
  setBloodConsentTerms,
} from "../../../store";
import { NavigationScreenProp } from "react-navigation";
import { format } from "date-fns";
import { EnrolledConfig } from "./EnrolledScreen";
import Description from "../../components/Description";
import SignatureBox from "../../components/SignatureBox";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  name: string;
  bloodSignature: string;
}

const BloodConsentConfig = {
  id: "BloodConsent",
  title: "bloodConsent",
  description: {
    label: "bloodThankYouAssisting",
  },
};

@connect((state: StoreState) => ({
  name: state.form!.name,
  bloodSignature: state.form!.bloodSignatureBase64,
}))
class BloodConsentScreen extends React.Component<Props & WithNamespaces> {
  _onSubmit = (signature: string) => {
    this.props.dispatch(setBloodConsentTerms(this.props.t("bloodFormText")));
    this.props.dispatch(setBloodSignaturePng(signature));
    this.props.navigation.push("Enrolled", { data: EnrolledConfig });
  };

  render() {
    const { t } = this.props;
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        <StatusBar
          canProceed={!!this.props.bloodSignature}
          progressNumber="90%"
          progressLabel={t("common:statusBar:enrollment")}
          title={this.props.navigation.getParam("priorTitle")}
          onBack={() => this.props.navigation.pop()}
          onForward={() => {
            this.props.navigation.push("Enrolled", { data: EnrolledConfig });
          }}
        />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Title label={t(BloodConsentConfig.title)} />
          <Description content={t(BloodConsentConfig.description.label)} />
          <Text>
            {this.props.t("bloodFormText")}
          </Text>
        </ScrollView>
        <View style={styles.input}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>{t("todaysDate")}</Text>
            <Text style={[styles.text, styles.dateText]}>
              {format(new Date(), "MM/D/YYYY")}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>{this.props.name}</Text>
          </View>
        </View>
        <SignatureBox
          canSubmit={true}
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
