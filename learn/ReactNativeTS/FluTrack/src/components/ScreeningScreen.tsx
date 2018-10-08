import React from "react";
import { TextInput, View, Alert } from "react-native";
import RadioForm from "react-native-simple-radio-button";
import DatePicker from "react-native-datepicker";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
var styles = require("../Styles.ts");

export default class ScreeningScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      participatedBefore: false,
      datePrevEnrollment: "2018-10-08"
    };
  }
  render() {
    const yesNo_options = [
      { label: "Yes", value: true },
      { label: "No", value: false }
    ];
    const noYes_options = [
      { label: "No", value: false },
      { label: "Yes", value: true }
    ];
    const county_options = [
      { label: "King", value: "King" },
      { label: "Snohomish", value: "Snohomish" },
      { label: "Pierce", value: "Pierce" },
      { label: "Island", value: "Island" },
      { label: "Skagit", value: "Skagit" }
    ];
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Screening for Participant</MyText>
        <FieldLabel label="Email">
          <TextInput
            style={styles.inputField}
            autoFocus={true}
            onChangeText={email => this.setState({ email })}
          />
        </FieldLabel>
        <FieldLabel label="Cell Phone">
          <TextInput
            style={styles.inputField}
            onChangeText={cellPhone => this.setState({ cellPhone })}
          />
        </FieldLabel>
        <MyText>Have you participated in this study previously?</MyText>
        <RadioForm
          radio_props={noYes_options}
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
              style={{ width: 200 }}
              date={this.state.datePrevEnrollment}
              mode="date"
              placeholder="select date"
              format="YYYY-MM-DD"
              minDate="2018-10-01"
              maxDate="2019-04-01"
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
        <FieldLabel label="Age">
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            onChangeText={age => this.setState({ age })}
          />
        </FieldLabel>
        <FieldLabel label="County">
          <RadioForm
            radio_props={county_options}
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
              this.props.navigation.navigate("Symptoms");
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
