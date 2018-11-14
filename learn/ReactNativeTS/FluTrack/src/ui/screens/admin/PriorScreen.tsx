import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { Action, setBloodCollection } from "../../../store";
import OptionTable from "./components/OptionTable";
import EditSettingButton from "./components/EditSettingButton";
import KeyValueLine from "./components/KeyValueLine";
import { Text, StyleSheet } from "react-native";
import ScreenContainer from "../experiment/components/ScreenContainer";

interface Props {
  location: string;
  bloodCollection: boolean;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
}

function getTodaysDate(): string {
  return new Date().toLocaleDateString();
}

@connect((state: StoreState) => ({
  location: state.admin!.location,
  bloodCollection: state.admin!.bloodCollection,
}))
export default class PriorScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Prior to Collection",
  };
  _onSelectLocation = () => {
    this.props.navigation.push("SelectLocation");
  };
  render() {
    return (
      <ScreenContainer>
        <KeyValueLine item="Date of Screening" value={getTodaysDate()} />
        <Text style={styles.sectionHeaderText}>Collection Location</Text>
        <EditSettingButton
          label={this.props.location ? this.props.location : "Select one"}
          onPress={this._onSelectLocation}
        />
        <Text style={styles.descriptionText}>
          The site where this device is being used to facilitate sample
          collection
        </Text>
        <Text style={styles.sectionHeaderText}>Blood Collection</Text>
        <OptionTable
          data={["Available", "Not Available"]}
          numColumns={1}
          selected={this.props.bloodCollection ? "Available" : "Not Available"}
          onChange={(answer: string) =>
            this.props.dispatch(setBloodCollection(answer === "Available"))
          }
        />
        <Text style={styles.descriptionText}>
          If blood sample collection is available at this site, then the option
          to contribute will be given to participants during enrollment.
        </Text>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  sectionHeaderText: {
    marginTop: 35,
    marginBottom: 7,
    marginLeft: 15,
    fontSize: 24,
  },
  descriptionText: {
    marginLeft: 15,
    fontSize: 17,
  },
});
