import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { Action, setAdverseEvents } from "../../../store";
import OptionList from "../experiment/components/OptionList";
import { Icon } from "react-native-elements";
import {
  Text,
  StyleSheet,
  View,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import ScreenContainer from "../experiment/components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  adverseEventTypes: Map<string, boolean>;
  dispatch(action: Action): void;
  screenProps: any;
}

const participantName = "John Doe"; //TODO: read the name out of redux
@connect((state: StoreState) => ({
  adverseEventTypes: state.form!.adverseEventTypes,
}))
export default class AdverseDetailsScreen extends React.Component<Props> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<any, any>;
  }) => {
    const params = navigation.state.params;
    return params == null
      ? {}
      : {
          title: "Adverse Events",
          headerLeft: (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.actionContainerWithIcon}
            >
              <Icon
                name="chevron-left"
                color="#007AFF"
                size={30}
                type="feather"
              />
              <Text style={styles.actionText}>Back</Text>
            </TouchableOpacity>
          ),
          headerRight: (
            <TouchableOpacity
              onPress={params._onSave}
              style={styles.actionContainer}
            >
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          ),
        };
  };
  state = {
    bloodDrawEvents: OptionList.emptyMap([
      "Bruising at site",
      "Infection at site",
      "Other",
    ]),
    nasalSwabEvents: OptionList.emptyMap(["Nosebleed", "Other"]),
    bloodDrawOther: "",
    nasalSwabOther: "",
  };
  bloodDrawOtherInput = React.createRef<TextInput>();
  nasalSwabOtherInput = React.createRef<TextInput>();
  componentWillMount() {
    this.props.navigation.setParams({
      _onSave: this._onSave,
    });
  }
  _onSave = () => {
    if (
      this.state.bloodDrawEvents.get("Other") &&
      this.state.bloodDrawOther.length === 0
    ) {
      Alert.alert(
        "Please specify the other adverse event for the blood draw.",
        "",
        [
          {
            text: "OK",
            onPress: () => {
              this.bloodDrawOtherInput.current!.focus();
            },
          },
        ]
      );
      return;
    }
    if (
      this.state.nasalSwabEvents.get("Other") &&
      this.state.nasalSwabOther.length === 0
    ) {
      Alert.alert(
        "Please specify the other adverse event for the nasal swab.",
        "",
        [
          {
            text: "OK",
            onPress: () => {
              this.nasalSwabOtherInput.current!.focus();
            },
          },
        ]
      );
      return;
    }
    // Flatten the two Maps into one string[] to store in redux
    let adverseEvents = Array.from(this.state.bloodDrawEvents.keys())
      .filter(event => this.state.bloodDrawEvents.get(event))
      .map(
        event =>
          event === "Other"
            ? "Blood draw: Other - " + this.state.bloodDrawOther
            : "Blood draw: " + event
      );
    adverseEvents = adverseEvents.concat(
      Array.from(this.state.nasalSwabEvents.keys())
        .filter(event => this.state.nasalSwabEvents.get(event))
        .map(
          event =>
            event === "Other"
              ? "Nasal swab: Other - " + this.state.nasalSwabOther
              : "Nasal swab: " + event
        )
    );
    if (adverseEvents.length === 0) {
      Alert.alert("Please select at least 1 adverse event.");
      return;
    }
    Alert.alert(
      "Submit?",
      `${adverseEvents.length} adverse event${
        adverseEvents.length == 1 ? "" : "s"
      } will be recorded for this collection for ${participantName}.`,
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
            <OptionList
              data={this.state.bloodDrawEvents}
              numColumns={1}
              multiSelect={true}
              fullWidth={true}
              backgroundColor="#fff"
              onChange={bloodDrawEvents => this.setState({ bloodDrawEvents })}
            />
            {this.state.bloodDrawEvents.get("Other") && (
              <TextInput
                style={styles.textInput}
                ref={this.bloodDrawOtherInput}
                autoFocus={true}
                placeholder="Please specify other event"
                onChangeText={bloodDrawOther =>
                  this.setState({ bloodDrawOther })
                }
                value={this.state.bloodDrawOther}
              />
            )}
          </View>
        )}
        {this.props.adverseEventTypes.get("Nasal swab") && (
          <View>
            <Text style={styles.sectionHeaderText}>
              For nasal swab, what were the adverse events?
            </Text>
            <OptionList
              data={this.state.nasalSwabEvents}
              numColumns={1}
              multiSelect={true}
              fullWidth={true}
              backgroundColor="#fff"
              onChange={nasalSwabEvents => this.setState({ nasalSwabEvents })}
            />
            {this.state.nasalSwabEvents.get("Other") && (
              <TextInput
                style={styles.textInput}
                ref={this.nasalSwabOtherInput}
                autoFocus={true}
                placeholder="Please specify other event"
                onChangeText={nasalSwabOther =>
                  this.setState({ nasalSwabOther })
                }
                value={this.state.nasalSwabOther}
              />
            )}
          </View>
        )}
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
  buttonView: {
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    borderBottomColor: "#aaa",
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontSize: 15,
    marginHorizontal: 20,
    marginBottom: 25,
  },
  actionContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  actionContainerWithIcon: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  actionText: {
    fontFamily: "System",
    fontSize: 17,
    color: "#007AFF",
    lineHeight: 22,
    letterSpacing: -0.41,
  },
});
