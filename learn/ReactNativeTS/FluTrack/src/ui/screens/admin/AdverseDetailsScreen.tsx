import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { Action, setAdverseEvents } from "../../../store";
import OptionTableMulti from "./components/OptionTableMulti";
import Button from "../experiment/components/Button";
import { Text, StyleSheet, View, Alert, TextInput } from "react-native";
import ScreenContainer from "../experiment/components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  adverseEventTypes: Map<string, boolean>;
  dispatch(action: Action): void;
  screenProps: any;
}

@connect((state: StoreState) => ({
  adverseEventTypes: state.form!.adverseEventTypes,
}))
export default class AdverseDetailsScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Adverse Events Details",
  };
  state = {
    bloodDrawEvents: new Map<string, boolean>(),
    nasalSwabEvents: new Map<string, boolean>(),
    bloodDrawOther: "",
    nasalSwabOther: "",
  };
  _onSubmit = () => {
    if (
      this.state.bloodDrawEvents.get("Other") &&
      this.state.bloodDrawOther.length === 0
    ) {
      Alert.alert("Please specify the other adverse event for the blood draw.");
      return;
    }
    if (
      this.state.nasalSwabEvents.get("Other") &&
      this.state.nasalSwabOther.length === 0
    ) {
      Alert.alert("Please specify the other adverse event for the nasal swab.");
      return;
    }
    // Flatten the two Maps into one string[] to store in redux
    let adverseEvents = Array.from(this.state.bloodDrawEvents.keys())
      .filter(event => this.state.bloodDrawEvents.get(event))
      .map(
        event =>
          event === "Other"
            ? "Blood draw: " + this.state.bloodDrawOther
            : "Blood draw: " + event
      );
    adverseEvents = adverseEvents.concat(
      Array.from(this.state.nasalSwabEvents.keys())
        .filter(event => this.state.nasalSwabEvents.get(event))
        .map(
          event =>
            event === "Other"
              ? "Nasal swab: " + this.state.nasalSwabOther
              : "Nasal swab: " + event
        )
    );
    if (adverseEvents.length === 0) {
      Alert.alert("Please select at least 1 adverse event.");
      return;
    }
    Alert.alert(
      "Submit?",
      adverseEvents.length +
        " adverse event(s) will be recorded for this collection.",
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "OK",
          onPress: () => {
            this.props.dispatch(setAdverseEvents(adverseEvents));
            this.props.navigation.popToTop();
          },
        },
      ]
    );
  };

  render() {
    return (
      <ScreenContainer>
        {this.props.adverseEventTypes.get("Blood draw") && (
          <View>
            <Text style={styles.sectionHeaderText}>
              For blood draw, what were the adverse events?
            </Text>
            <OptionTableMulti
              data={["Bruising at site", "Infection at site", "Other"]}
              numColumns={1}
              onChange={bloodDrawEvents => this.setState({ bloodDrawEvents })}
            />
            {this.state.bloodDrawEvents.get("Other") && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.specifyPrompt}>Please specify:</Text>
                <TextInput
                  style={styles.otherInput}
                  autoFocus={true}
                  multiline={true}
                  onChangeText={bloodDrawOther =>
                    this.setState({ bloodDrawOther })
                  }
                  value={this.state.bloodDrawOther}
                />
              </View>
            )}
          </View>
        )}
        {this.props.adverseEventTypes.get("Nasal swab") && (
          <View>
            <Text style={styles.sectionHeaderText}>
              For nasal swab, what were the adverse events?
            </Text>
            <OptionTableMulti
              data={["Nosebleed", "Other"]}
              numColumns={1}
              onChange={nasalSwabEvents => this.setState({ nasalSwabEvents })}
            />
            {this.state.nasalSwabEvents.get("Other") && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.specifyPrompt}>Please specify:</Text>
                <TextInput
                  style={styles.otherInput}
                  autoFocus={true}
                  multiline={true}
                  onChangeText={nasalSwabOther =>
                    this.setState({ nasalSwabOther })
                  }
                  value={this.state.nasalSwabOther}
                />
              </View>
            )}
          </View>
        )}
        <View style={styles.buttonView}>
          <Button
            primary={true}
            enabled={true}
            label="Submit"
            onPress={this._onSubmit}
          />
        </View>
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
  buttonView: {
    justifyContent: "center",
    alignItems: "center",
  },
  specifyPrompt: {
    marginLeft: 15,
    fontSize: 15,
  },
  otherInput: {
    fontSize: 15,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: "#fff",
    width: "80%",
  },
});
