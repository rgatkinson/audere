import React from "react";
import { TextInput, View, Alert } from "react-native";
import RadioForm from "react-native-simple-radio-button";
import CheckBox from "react-native-check-box";
import DatePicker from "react-native-datepicker";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
import styles from "../Styles";

export default class ScreeningScreen extends React.Component {
  constructor(props) {
    super(props);
    let today = new Date();
    this.state = {
      participatedBefore: false,
      county: "King",
      textOK: false
    };
  }
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
        <FieldLabel label="Email:">
          <TextInput
            style={styles.inputField}
            autoFocus={true}
            underlineColorAndroid="rgba(0,0,0,0)"
            onChangeText={email => this.setState({ email })}
          />
        </FieldLabel>
        <FieldLabel label="Cell Phone:">
          <TextInput
            style={styles.inputField}
            underlineColorAndroid="rgba(0,0,0,0)"
            onChangeText={cellPhone => this.setState({ cellPhone })}
          />
        </FieldLabel>
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              textOK: !this.state.textOK
            });
          }}
          isChecked={this.state.textOK}
          rightText={"OK to text"}
        />
        <MyText>Have you participated in this study previously?</MyText>
        <RadioForm
          radio_props={noYesOptions}
          initial={0}
          buttonColor={"#36b3a8"}
          selectedButtonColor={"#36b3a8"}
          onPress={participatedBefore => {
            this.setState({ participatedBefore });
          }}
        />
        {this.state.participatedBefore && (
          <View>
            <MyText>Date of previous enrollment</MyText>
            <DatePicker
              style={styles.datePicker}
              date={new Date()}
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
              onDateChange={datePrevEnrollment =>
                this.setState({ datePrevEnrollment })
              }
            />
          </View>
        )}
        <FieldLabel label="Age:">
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            underlineColorAndroid="rgba(0,0,0,0)"
            onChangeText={age => this.setState({ age })}
          />
        </FieldLabel>
        <FieldLabel label="County:">
          <RadioForm
            radio_props={countyOptions}
            initial={0}
            buttonColor={"#36b3a8"}
            selectedButtonColor={"#36b3a8"}
            onPress={county => {
              this.setState({ county });
            }}
          />
        </FieldLabel>
        <MyText>Are you feeling sick or unwell today?</MyText>
        <View style={styles.flexRow}>
          <StyledButton
            title="YES"
            onPress={() => {
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
      </ScreenView>
    );
  }
}
