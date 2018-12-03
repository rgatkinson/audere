import React from "react";
import { View, StyleSheet, Text, Alert } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState, SurveyResponse } from "../../../store";
import EditSettingButton from "../../components/EditSettingButton";
import Description from "../../components/Description";
import ScreenContainer from "../../components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
  surveyResponses: Map<string, SurveyResponse>;
}

@connect((state: StoreState) => ({
  surveyResponses: !!state.form ? state.form.surveyResponses : null,
}))
export default class SettingsScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Admin Settings",
  };
  _onPrior = () => {
    this.props.navigation.push("Prior");
  };
  _onAdverseEvents = () => {
    if (
      !!this.props.surveyResponses &&
      this.props.surveyResponses instanceof Map
    ) {
      this.props.navigation.push("Adverse");
    } else {
      Alert.alert(
        "No participant responses recorded. Please complete survey first."
      );
    }
  };
  _onSpecimenScans = () => {
    Alert.alert("This feature is not part of IRB 1");
  };
  render() {
    return (
      <ScreenContainer>
        <View style={styles.descriptionContainer}>
          <Description content="These settings should be set by study administrators and staff only." />
        </View>
        <EditSettingButton
          label="Prior to Collection"
          onPress={this._onPrior}
        />
        <Text style={styles.sectionHeaderText}>Post Collection</Text>
        <EditSettingButton
          label="Adverse Events"
          onPress={this._onAdverseEvents}
        />
        <EditSettingButton
          label="Specimen Scans"
          onPress={this._onSpecimenScans}
        />
        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>
            For technical support in using this app, contact Audere Support at
            support@auderenow.org.
          </Text>
        </View>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  descriptionContainer: {
    marginHorizontal: 15,
    marginTop: 25,
    marginBottom: 40,
  },
  sectionHeaderText: {
    marginTop: 35,
    marginBottom: 7,
    marginLeft: 15,
    fontSize: 24,
  },
  supportContainer: {
    marginTop: 50,
    marginHorizontal: 15,
  },
  supportText: {
    fontSize: 18,
  },
});
