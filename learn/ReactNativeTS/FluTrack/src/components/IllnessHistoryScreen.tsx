import React from "react";
import { TextInput } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import RadioForm from "react-native-simple-radio-button";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
import styles from "../Styles";

export default class IllnessHistoryScreen extends React.Component {
  state = {
    currentlyHospitalized: false
  };
  render() {
    const yesNoOptions = [
      { label: "Yes", value: true },
      { label: "No", value: false }
    ];
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Illness History</MyText>
        <FieldLabel label="Including today, how many days have you been sick?">
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            underlineColorAndroid="rgba(0,0,0,0)"
            onChangeText={daysSick => this.setState({ daysSick })}
          />
        </FieldLabel>
        <MyText>Currently hospitalized</MyText>
        <RadioForm
          radio_props={yesNoOptions}
          initial={1}
          buttonColor={"#36b3a8"}
          selectedButtonColor={"#36b3a8"}
          onPress={currentlyHospitalized => {
            this.setState({ currentlyHospitalized });
          }}
        />
        {this.state.currentlyHospitalized && (
          <FieldLabel label="Length of hospitalization (days):">
            <TextInput
              style={styles.inputField}
              keyboardType="numeric"
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={daysHospitalized =>
                this.setState({ daysHospitalized })
              }
            />
          </FieldLabel>
        )}
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate(this.props.onNext);
          }}
        />
      </ScreenView>
    );
  }
}
