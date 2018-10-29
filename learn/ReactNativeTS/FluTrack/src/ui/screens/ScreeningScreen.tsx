import React from "react";
import { View, Alert } from "react-native";
import CheckBox from "../components/CheckBox";
import DatePicker from "../components/DatePicker";
import Button from "../components/Button";
import RadioButton from "../components/RadioButton";
import FieldLabel from "../components/FieldLabel";
import ScreenView from "../components/ScreenView";
import Text from "../components/Text";
import { connect } from "react-redux";
import { SET_AGE } from "../../store/Constants";
import { NavigationScreenProp } from "react-navigation";
import { interact, goToNextScreen } from "../../../App";
import styles from "../Styles";
import ValidatedInput from "../components/ValidatedInput";
import { setAge, Action } from "../../store";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

class ScreeningScreen extends React.Component<Props, any> {
  static navigationOptions = {
    title: "Screening for Participant",
  };

  cellInput: any;
  ageInput: any;

  state = {
    participatedBefore: false,
    datePrevEnrollment: new Date(),
    textOK: false,
    age: "",
  };

  saveAge = (age: number) => {
    this.props.dispatch(setAge(age));
  };

  render() {
    const noYesOptions = [
      { label: "No", value: false },
      { label: "Yes", value: true },
    ];
    const countyOptions = [
      { label: "King", value: "King" },
      { label: "Snohomish", value: "Snohomish" },
      { label: "Pierce", value: "Pierce" },
      { label: "Island", value: "Island" },
      { label: "Skagit", value: "Skagit" },
    ];
    return (
      <ScreenView>
        <View style={styles.formLayout}>
          <FieldLabel label="Email:">
            <ValidatedInput
              inputType="email"
              autoFocus={true}
              placeholder="name@example.com"
              onChangeText={email => this.setState({ email })}
              onSubmitEditing={() => {
                this.cellInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Cell Phone:">
            <View style={{ flexDirection: "column" }}>
              <ValidatedInput
                style={{ marginBottom: 0 }}
                inputType="phone"
                myRef={i => {
                  this.cellInput = i;
                }}
                placeholder="206-555-1212"
                onChangeText={cellPhone => this.setState({ cellPhone })}
              />
              <CheckBox
                style={{ paddingTop: 0 }}
                onClick={() => {
                  this.setState({
                    textOK: !this.state.textOK,
                  });
                }}
                isChecked={this.state.textOK}
                text={"OK to text"}
              />
            </View>
          </FieldLabel>
          <Text>Have you participated in this study previously?</Text>
          <FieldLabel label="">
            <RadioButton
              options={noYesOptions}
              onPress={participatedBefore => {
                this.setState({ participatedBefore });
              }}
            />
          </FieldLabel>
          {this.state.participatedBefore && (
            <View>
              <Text>Date of previous enrollment:</Text>
              <FieldLabel label="">
                <DatePicker
                  date={this.state.datePrevEnrollment}
                  onDateChange={(datePrevEnrollment: any) => {
                    this.setState({ datePrevEnrollment });
                    this.ageInput.focus();
                  }}
                />
              </FieldLabel>
            </View>
          )}
          <FieldLabel label="Age:">
            <ValidatedInput
              inputType="nonNegativeInteger"
              max={150}
              myRef={i => {
                this.ageInput = i;
              }}
              onChangeText={age => this.setState({ age })}
            />
          </FieldLabel>
          <FieldLabel label="County:">
            <RadioButton
              options={countyOptions}
              initial={-1}
              onPress={county => {
                this.setState({ county });
              }}
            />
          </FieldLabel>
          <Text>Are you feeling sick or unwell today?</Text>
          <FieldLabel label="">
            <Button
              title="YES"
              onPress={() => {
                this.saveAge(+this.state.age);
                interact(JSON.stringify(this.state));
                goToNextScreen(this.props.navigation);
              }}
            />
            <Button
              title="NO"
              onPress={() => {
                Alert.alert("Thank you for your time. Goodbye.");
              }}
            />
          </FieldLabel>
        </View>
      </ScreenView>
    );
  }
}

export default connect()(ScreeningScreen);
