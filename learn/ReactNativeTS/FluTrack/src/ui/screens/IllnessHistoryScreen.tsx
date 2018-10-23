import React from "react";
import { View } from "react-native";
import Button from "../components/Button";
import FieldLabel from "../components/FieldLabel";
import RadioButton from "../components/RadioButton";
import ScreenView from "../components/ScreenView";
import ValidatedInput from "../components/ValidatedInput";
import Text from "../components/Text";
import { NavigationScreenProp } from "react-navigation";
import { interact, goToNextScreen } from "../../../App";
import styles from "../Styles";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}
export default class IllnessHistoryScreen extends React.Component<Props, any> {
  static navigationOptions = {
    title: "Illness History",
  };

  state = {
    currentlyHospitalized: false,
  };

  render() {
    return (
      <ScreenView>
        <View style={styles.formLayout}>
          <Text>Including today, how many days have you been sick?</Text>
          <FieldLabel label="">
            <ValidatedInput
              inputType="nonNegativeInteger"
              autoFocus={true}
              onChangeText={daysSick => this.setState({ daysSick })}
            />
          </FieldLabel>
          <Text>Currently hospitalized</Text>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={currentlyHospitalized => {
                this.setState({ currentlyHospitalized });
              }}
            />
          </FieldLabel>
          {this.state.currentlyHospitalized && (
            <View>
              <Text>Length of hospitalization (days):</Text>
              <FieldLabel label="">
                <ValidatedInput
                  inputType="nonNegativeInteger"
                  autoFocus={true}
                  onChangeText={daysHospitalized =>
                    this.setState({ daysHospitalized })
                  }
                />
              </FieldLabel>
            </View>
          )}
        </View>
        <Button
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            goToNextScreen(this.props.navigation);
          }}
        />
      </ScreenView>
    );
  }
}
