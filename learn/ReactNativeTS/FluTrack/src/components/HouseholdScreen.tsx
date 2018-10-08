import React from "react";
import { TextInput, View } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import RadioForm from "react-native-simple-radio-button";
import { interact } from "../../App";
var styles = require("../Styles.ts");

export default class HouseholdScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      householdIllnessLast4Weeks: false,
      householdTravelLast4Weeks: false,
      householdHospitalizedLast4Weeks: false,
      travelLast4weeks: false
    };
  }
  render() {
    const yesNo_options = [
      { label: "Yes", value: true },
      { label: "No", value: false }
    ];
    const residence_options = [
      { label: "House", value: "0" },
      { label: "Apartment", value: "1" },
      { label: "Shelter", value: "2" },
      { label: "None", value: "3" }
    ];
    const childCare_options = [
      { label: "Yes, the participant", value: "0" },
      { label: "Yes, another child", value: "1" },
      { label: "No or not applicable", value: "2" }
    ];
    return (
      <ScreenView>
        <MyText style={styles.headingText}>
          Household Composition and Exposure
        </MyText>
        <MyText>Which best describes your residence?</MyText>
        <RadioForm
          radio_props={residence_options}
          initial={0}
          buttonColor={"#36b3a8"}
          selectedButtonColor={"#36b3a8"}
          onPress={residenceType => {
            this.setState({ residenceType });
          }}
        />
        <FieldLabel label="How many individuals share your residence?">
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            onChangeText={householdSize => this.setState({ householdSize })}
          />
        </FieldLabel>
        {this.state.householdSize > 1 && (
          <View>
            <FieldLabel label="What are their ages?">
              <TextInput
                style={styles.inputField}
                onChangeText={householdAges => this.setState({ householdAges })}
              />
            </FieldLabel>
            <MyText>
              Do any children attend a childcare setting or play group with at
              least 3 other children for 3 or more hours/day?
            </MyText>
            <RadioForm
              radio_props={childCare_options}
              initial={2}
              buttonColor={"#36b3a8"}
              selectedButtonColor={"#36b3a8"}
              onPress={childCare => {
                this.setState({ childCare });
              }}
            />
          </View>
        )}
        <FieldLabel label="How many rooms (excluding bathrooms) make up your residence?">
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            onChangeText={numRooms => this.setState({ numRooms })}
          />
        </FieldLabel>
        <MyText>
          Have any household contacts been ill in the last 4 weeks?
        </MyText>
        <RadioForm
          radio_props={yesNo_options}
          initial={1}
          buttonColor={"#36b3a8"}
          selectedButtonColor={"#36b3a8"}
          onPress={householdIllnessLast4Weeks => {
            this.setState({ householdIllnessLast4Weeks });
          }}
        />
        {this.state.householdIllnessLast4Weeks && (
          <View>
            <MyText>Were they hospitalized?</MyText>
            <RadioForm
              radio_props={yesNo_options}
              initial={1}
              buttonColor={"#36b3a8"}
              selectedButtonColor={"#36b3a8"}
              onPress={householdHospitalizedLast4Weeks => {
                this.setState({ householdHospitalizedLast4Weeks });
              }}
            />
          </View>
        )}
        <MyText>
          Have any household contacts travelled in the last 4 weeks?
        </MyText>
        <RadioForm
          radio_props={yesNo_options}
          initial={1}
          buttonColor={"#36b3a8"}
          selectedButtonColor={"#36b3a8"}
          onPress={householdTravelLast4Weeks => {
            this.setState({ householdTravelLast4Weeks });
          }}
        />
        {this.state.householdTravelLast4Weeks && (
          <View>
            <MyText>Outside of WA State</MyText>
            <RadioForm
              radio_props={yesNo_options}
              initial={1}
              buttonColor={"#36b3a8"}
              selectedButtonColor={"#36b3a8"}
              onPress={householdTravelOutsideWA => {
                this.setState({ householdTravelOutsideWA });
              }}
            />
            <MyText>Outside of the United States</MyText>
            <RadioForm
              radio_props={yesNo_options}
              initial={1}
              buttonColor={"#36b3a8"}
              selectedButtonColor={"#36b3a8"}
              onPress={householdTravelOutsideUS => {
                this.setState({ householdTravelOutsideUS });
              }}
            />
          </View>
        )}
        <MyText>Have you travelled in the last 4 weeks?</MyText>
        <RadioForm
          radio_props={yesNo_options}
          initial={1}
          buttonColor={"#36b3a8"}
          selectedButtonColor={"#36b3a8"}
          onPress={travelLast4weeks => {
            this.setState({ travelLast4weeks });
          }}
        />
        {this.state.travelLast4weeks && (
          <View>
            <MyText>Outside of WA State</MyText>
            <RadioForm
              radio_props={yesNo_options}
              initial={1}
              buttonColor={"#36b3a8"}
              selectedButtonColor={"#36b3a8"}
              onPress={travelOutsideWA => {
                this.setState({ travelOutsideWA });
              }}
            />
            <MyText>Outside of the United States</MyText>
            <RadioForm
              radio_props={yesNo_options}
              initial={1}
              buttonColor={"#36b3a8"}
              selectedButtonColor={"#36b3a8"}
              onPress={travelOutsideUS => {
                this.setState({ travelOutsideUS });
              }}
            />
          </View>
        )}
        <MyText>Do you or any household contacts smoke?</MyText>
        <RadioForm
          radio_props={yesNo_options}
          initial={1}
          buttonColor={"#36b3a8"}
          selectedButtonColor={"#36b3a8"}
          onPress={smokerInHousehold => {
            this.setState({ smokerInHousehold });
          }}
        />
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate("IllnessHistory");
          }}
        />
      </ScreenView>
    );
  }
}
