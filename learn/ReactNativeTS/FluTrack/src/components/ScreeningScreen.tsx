import React from "react";
import { View, Alert } from "react-native";
import CheckBox from "./CheckBox";
import DatePicker from "./DatePicker";
import Button from "./ui/Button";
import RadioButton from "./RadioButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { connect } from "react-redux";
import { SET_AGE } from "../store/Constants";
import { NavigationScreenProp } from "react-navigation";
import { interact, goToNextScreen } from "../../App";
import styles from "../Styles";
import ValidatedInput from "./ValidatedInput";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

class ScreeningScreen extends React.Component<Props, any> {
  static navigationOptions = {
    title: "Screening for Participant",
  };

  state = {
    participatedBefore: false,
    datePrevEnrollment: new Date(),
    textOK: false,
    age: "",
  };
  saveAge = (age: number) => {
    this.props.dispatch({ type: SET_AGE, payload: age });
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
          <MyText>Have you participated in this study previously?</MyText>
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
              <MyText>Date of previous enrollment:</MyText>
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
          <MyText>Are you feeling sick or unwell today?</MyText>
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
