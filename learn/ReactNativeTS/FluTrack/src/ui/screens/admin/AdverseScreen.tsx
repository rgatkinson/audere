import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { Action, setAdverseEventTypes } from "../../../store";
import OptionTable from "./components/OptionTable";
import OptionList from "../experiment/components/OptionList";
import { Text, StyleSheet, View, Alert, TouchableOpacity } from "react-native";
import ScreenContainer from "../experiment/components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
  screenProps: any;
  adverseEventTypes?: Map<string, boolean>;
}

const participantName = "John Doe"; //TODO: read the name out of redux
@connect((state: StoreState) => ({
  adverseEventTypes: state.form!.adverseEventTypes,
}))
export default class AdverseScreen extends React.Component<Props> {
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
              onPress={() => navigation.popToTop()}
              style={styles.actionContainer}
            >
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: (
            <TouchableOpacity
              onPress={params._onNext}
              style={styles.actionContainer}
            >
              <Text style={styles.actionText}>Next</Text>
            </TouchableOpacity>
          ),
        };
  };
  state = {
    adverseEvents: false,
  };
  componentWillMount() {
    this.props.navigation.setParams({
      _onNext: this._onNext,
    });
  }
  _onNext = () => {
    if (this.state.adverseEvents) {
      if (
        this.props.adverseEventTypes instanceof Map
          ? Array.from(this.props.adverseEventTypes.values()).reduce(
              (result, value) => result || value,
              false
            )
          : false
      ) {
        this.props.navigation.push("AdverseDetails");
      } else {
        Alert.alert("Please specify which procedures had adverse events.");
      }
    } else {
      Alert.alert(
        "Submit?",
        "No adverse events will be recorded for this collection.",
        [
          {
            text: "Cancel",
            onPress: () => {},
          },
          {
            text: "OK",
            onPress: () => {
              this.props.navigation.popToTop();
            },
          },
        ]
      );
    }
  };

  render() {
    return (
      <ScreenContainer>
        <Text style={styles.sectionHeaderText}>
          Were there any adverse events experienced from the last collection for{" "}
          {participantName}?
        </Text>
        <OptionTable
          data={["Yes", "No"]}
          numColumns={1}
          selected={this.state.adverseEvents ? "Yes" : "No"}
          onChange={(answer: string) =>
            this.setState({ adverseEvents: answer === "Yes" })
          }
        />
        {this.state.adverseEvents && (
          <View>
            <Text style={styles.sectionHeaderText}>
              Which procedures had adverse events?
            </Text>
            <OptionList
              data={
                this.props.adverseEventTypes instanceof Map
                  ? this.props.adverseEventTypes
                  : OptionList.emptyMap(["bloodDraw", "nasalSwab"])
              }
              numColumns={1}
              multiSelect={true}
              fullWidth={true}
              backgroundColor="#fff"
              onChange={adverseEventTypes =>
                this.props.dispatch(setAdverseEventTypes(adverseEventTypes))
              }
            />
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
  descriptionText: {
    marginLeft: 15,
    fontSize: 17,
  },
  buttonView: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  actionText: {
    fontFamily: "System",
    fontSize: 17,
    color: "#007AFF",
    lineHeight: 22,
    letterSpacing: -0.41,
  },
});
