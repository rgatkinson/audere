import React from "react";
import { NavigationScreenProp } from "react-navigation";
import EditSettingButton from "./components/EditSettingButton";
import Description from "../experiment/components/Description";
import { View, StyleSheet, Text, Alert } from "react-native";
import ScreenContainer from "../experiment/components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
}

export default class SettingsScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Admin Settings",
  };
  _onPrior = () => {
    this.props.navigation.push("Prior");
  };
  _onAdverseEvents = () => {
    this.props.navigation.push("Adverse");
  };
  _onSpecimenScans = () => {
    Alert.alert("Placeholder for unknown screen");
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
});
