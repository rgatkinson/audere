import React from "react";
import { Text, StyleSheet } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, setBloodCollection } from "../../../store";
import EditSettingButton from "../../components/EditSettingButton";
import KeyValueLine from "../../components/KeyValueLine";
import OptionList from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";

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
  location: state.admin == null ? null : state.admin.location,
  bloodCollection: state.admin == null ? false : state.admin.bloodCollection,
}))
class PriorScreen extends React.Component<Props & WithNamespaces> {
  static navigationOptions = {
    title: "Prior to Collection",
  };
  _onSelectLocation = () => {
    this.props.navigation.push("SelectLocation");
  };
  _getBloodCollectionOptions(bloodCollection: boolean): Map<string, boolean> {
    return new Map([
      ["Available", bloodCollection],
      ["Not Available", !bloodCollection],
    ]);
  }
  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <KeyValueLine item="Date of Screening" value={getTodaysDate()} />
        <Text style={styles.sectionHeaderText}>Collection Location</Text>
        <EditSettingButton
          label={
            this.props.location
              ? t("surveyOption:" + this.props.location)
              : "Select one"
          }
          onPress={this._onSelectLocation}
        />
        <Text style={styles.descriptionText}>
          The site where this device is being used to facilitate sample
          collection
        </Text>
        <Text style={styles.sectionHeaderText}>Blood Collection</Text>
        <OptionList
          data={this._getBloodCollectionOptions(this.props.bloodCollection)}
          numColumns={1}
          fullWidth={true}
          multiSelect={false}
          backgroundColor="#fff"
          onChange={data =>
            this.props.dispatch(setBloodCollection(!!data.get("Available")))
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

export default withNamespaces()(PriorScreen);
