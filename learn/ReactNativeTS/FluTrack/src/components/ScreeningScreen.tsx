import React from "react";
import { TextInput, View, Alert } from "react-native";
import CheckBox from "react-native-check-box";
import DatePicker from "react-native-datepicker";
import StyledButton from "./StyledButton";
import RadioButton from "./RadioButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { connect } from "react-redux";
import { SET_AGE } from "../store/Constants";
import { NavigationScreenProp } from "react-navigation";
import { interact } from "../../App";
import styles from "../Styles";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  onNext: string;
}

class ScreeningScreen extends React.Component<Props, any> {
  state = {
    participatedBefore: false,
    datePrevEnrollment: new Date(),
    textOK: false,
    age: ""
  };
  saveAge = (age: number) => {
    this.props.dispatch({ type: SET_AGE, payload: age });
  };
  render() {
    const noYesOptions = [
      { label: "No", value: false },
      { label: "Yes", value: true }
    ];
    const countyOptions = [
      { label: "King", value: "King" },
      { label: "Snohomish", value: "Snohomish" },
      { label: "Pierce", value: "Pierce" },
      { label: "Island", value: "Island" },
      { label: "Skagit", value: "Skagit" }
    ];
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Screening for Participant</MyText>
        <View style={styles.formLayout}>
          <FieldLabel label="Email:">
            <TextInput
              style={[styles.inputField, { width: 150 }]}
              autoFocus={true}
              underlineColorAndroid="rgba(0,0,0,0)"
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={email => this.setState({ email })}
              onSubmitEditing={() => {
                this.cellInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Cell Phone:">
            <View style={{ flexDirection: "column" }}>
              <TextInput
                style={[styles.inputField, { width: 150, marginBottom: 3 }]}
                ref={i => {
                  this.cellInput = i;
                }}
                underlineColorAndroid="rgba(0,0,0,0)"
                placeholder="206-555-1212"
                keyboardType="numeric"
                onChangeText={cellPhone => this.setState({ cellPhone })}
              />
              <CheckBox
                style={[styles.checkbox, { paddingTop: 0 }]}
                onClick={() => {
                  this.setState({
                    textOK: !this.state.textOK
                  });
                }}
                isChecked={this.state.textOK}
                rightText={"OK to text"}
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
                  style={styles.datePicker}
                  date={this.state.datePrevEnrollment}
                  mode="date"
                  placeholder="select date"
                  format="YYYY-MM-DD"
                  confirmBtnText="Confirm"
                  cancelBtnText="Cancel"
                  customStyles={{
                    dateIcon: {
                      position: "absolute",
                      left: 0,
                      top: 4,
                      marginLeft: 0
                    },
                    dateInput: {
                      marginLeft: 36
                    }
                  }}
                  onDateChange={(datePrevEnrollment: any) => {
                    this.setState({ datePrevEnrollment });
                    this.ageInput.focus();
                    //Alert.alert("foo");
                  }}
                />
              </FieldLabel>
            </View>
          )}
          <FieldLabel label="Age:">
            <TextInput
              style={styles.inputField}
              ref={i => {
                this.ageInput = i;
              }}
              keyboardType="numeric"
              underlineColorAndroid="rgba(0,0,0,0)"
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
            <View style={styles.flexRow}>
              <StyledButton
                title="YES"
                onPress={() => {
                  this.saveAge(+this.state.age);
                  interact(JSON.stringify(this.state));
                  this.props.navigation.navigate(this.props.onNext);
                }}
              />
              <StyledButton
                title="NO"
                onPress={() => {
                  Alert.alert("Thank you for your time. Goodbye.");
                }}
              />
            </View>
          </FieldLabel>
        </View>
      </ScreenView>
    );
  }
}

export default connect()(ScreeningScreen);
