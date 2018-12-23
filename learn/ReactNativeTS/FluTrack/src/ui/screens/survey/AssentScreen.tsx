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
  setAssent,
} from "../../../store";
import { ConsentInfo, ConsentInfoSignerType } from "audere-lib";
import { EnrolledConfig } from "../../../resources/ScreenConfig";
import { NavigationScreenProp } from "react-navigation";
import { format } from "date-fns";
import Button from "../../components/Button";
import Description from "../../components/Description";
import SignatureInput from "../../components/SignatureInput";
import StatusBar from "../../components/StatusBar";

interface Props {
  assent?: ConsentInfo;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  name: string;
}

@connect((state: StoreState) => ({
  assent: state.form.assent,
  name: state.form!.name,
}))
class AssentScreen extends React.Component<Props & WithNamespaces> {

  _onSubmit = (participantName: string, signerType: ConsentInfoSignerType, signerName: string, signature: string) => {
    this.props.dispatch(setAssent({
      name: signerName,
      terms: this.props.t("assentFormHeader") + "\n" + this.props.t("assentFormText"),
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
          canProceed={!!this.props.assent}
          progressNumber="90%"
          progressLabel={t("common:statusBar:enrollment")}
          title={t("assentTitle")}
          onBack={() => this.props.navigation.pop()}
          onForward={this._proceed}
        />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={[styles.consentText, {textAlign: 'center'}]}>
            {t("assentFormHeader")}
          </Text>
          <Text style={styles.consentText}>
            {t("assentFormText")}
          </Text>
          <SignatureInput
            consent={this.props.assent}
            editableNames={false}
            participantName={this.props.name}
            signerType={ConsentInfoSignerType.Subject}
            onSubmit={this._onSubmit}
          />
          <Button
            enabled={!!this.props.assent}
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

export default withNamespaces("assentScreen")<Props>(AssentScreen);
