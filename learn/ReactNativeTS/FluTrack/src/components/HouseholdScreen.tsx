import React from "react";
import { TextInput, View } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import RadioButton from "./RadioButton";
import { interact } from "../../App";
import { NavigationScreenProp } from "react-navigation";
import styles from "../Styles";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  onNext: string;
}
export default class HouseholdScreen extends React.Component<Props, any> {
  state = {
    residenceType: 0,
    childCare: 2,
    householdSize: 1,
    respiratoryLastYear: false,
    householdIllnessLast4Weeks: false,
    householdTravelLast4Weeks: false,
    householdTravelOutsideWA: false,
    householdTravelOutsideUS: false,
    householdHospitalizedLast4Weeks: false,
    travelLast4weeks: false,
    travelOutsideUS: false,
    travelOutsideWA: false,
    smokerInHousehold: false
  };
  render() {
    const residenceOptions = [
      { label: "House", value: 0 },
      { label: "Apartment", value: 1 },
      { label: "Shelter", value: 2 },
      { label: "None", value: 3 }
    ];
    const childCareOptions = [
      { label: "Yes, the participant", value: 0 },
      { label: "Yes, another child", value: 1 },
      { label: "No or not applicable", value: 2 }
    ];
    return (
      <ScreenView>
        <MyText style={styles.headingText}>
          Household Composition and Exposure
        </MyText>
        <View style={styles.formLayout}>
          <MyText>Which best describes your residence?</MyText>
          <FieldLabel label="">
            <RadioButton
              options={residenceOptions}
              onPress={residenceType => {
                this.setState({ residenceType });
              }}
            />
          </FieldLabel>
          <MyText>How many individuals share your residence?</MyText>
          <FieldLabel label="">
            <TextInput
              style={styles.inputField}
              keyboardType="numeric"
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={householdSize => this.setState({ householdSize })}
            />
          </FieldLabel>
          {this.state.householdSize > 1 && (
            <View>
              <FieldLabel label="Their ages?">
                <TextInput
                  style={styles.inputField}
                  underlineColorAndroid="rgba(0,0,0,0)"
                  placeholder="ex: 5,7,40"
                  onChangeText={householdAges =>
                    this.setState({ householdAges })
                  }
                />
              </FieldLabel>
              <MyText>
                Do any children attend a childcare setting or play group with at
                least 3 other children for 3 or more hours/day?
              </MyText>
              <FieldLabel label="">
                <RadioButton
                  options={childCareOptions}
                  initial={2}
                  onPress={childCare => {
                    this.setState({ childCare });
                  }}
                />
              </FieldLabel>
            </View>
          )}
          <MyText>
            How many rooms (excluding bathrooms) make up your residence?
          </MyText>
          <FieldLabel label="">
            <TextInput
              style={styles.inputField}
              keyboardType="numeric"
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={numRooms => this.setState({ numRooms })}
            />
          </FieldLabel>
          <MyText>
            Have you had pneumonia or other respiratory cold in the last year?
          </MyText>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={respiratoryLastYear => {
                this.setState({ respiratoryLastYear });
              }}
            />
          </FieldLabel>
          <MyText>
            Have any household contacts been ill in the last 4 weeks?
          </MyText>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={householdIllnessLast4Weeks => {
                this.setState({ householdIllnessLast4Weeks });
              }}
            />
          </FieldLabel>
          {this.state.householdIllnessLast4Weeks && (
            <View>
              <MyText>Were they hospitalized?</MyText>
              <FieldLabel label="">
                <RadioButton
                  initial={1}
                  onPress={householdHospitalizedLast4Weeks => {
                    this.setState({ householdHospitalizedLast4Weeks });
                  }}
                />
              </FieldLabel>
            </View>
          )}
          <MyText>
            Have any household contacts travelled in the last 4 weeks?
          </MyText>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={householdTravelLast4Weeks => {
                this.setState({ householdTravelLast4Weeks });
              }}
            />
          </FieldLabel>
          {this.state.householdTravelLast4Weeks && (
            <View>
              <MyText>Outside of WA State</MyText>
              <FieldLabel label="">
                <RadioButton
                  initial={1}
                  onPress={householdTravelOutsideWA => {
                    this.setState({ householdTravelOutsideWA });
                  }}
                />
              </FieldLabel>
              <MyText>Outside of the United States</MyText>
              <FieldLabel label="">
                <RadioButton
                  initial={1}
                  onPress={householdTravelOutsideUS => {
                    this.setState({ householdTravelOutsideUS });
                  }}
                />
              </FieldLabel>
            </View>
          )}
          <MyText>Have you travelled in the last 4 weeks?</MyText>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={travelLast4weeks => {
                this.setState({ travelLast4weeks });
              }}
            />
          </FieldLabel>
          {this.state.travelLast4weeks && (
            <View>
              <MyText>Outside of WA State</MyText>
              <FieldLabel label="">
                <RadioButton
                  initial={1}
                  onPress={travelOutsideWA => {
                    this.setState({ travelOutsideWA });
                  }}
                />
              </FieldLabel>
              <MyText>Outside of the United States</MyText>
              <FieldLabel label="">
                <RadioButton
                  initial={1}
                  onPress={travelOutsideUS => {
                    this.setState({ travelOutsideUS });
                  }}
                />
              </FieldLabel>
            </View>
          )}
          <MyText>Do you or any household contacts smoke?</MyText>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={smokerInHousehold => {
                this.setState({ smokerInHousehold });
              }}
            />
          </FieldLabel>
        </View>
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
