import React from "react";
import { View } from "react-native";
import Button from "../components/Button";
import FieldLabel from "../components/FieldLabel";
import ScreenView from "../components/ScreenView";
import Text from "../components/Text";
import RadioButton from "../components/RadioButton";
import ValidatedInput from "../components/ValidatedInput";
import { goToNextScreen } from "../../../App";
import { NavigationScreenProp } from "react-navigation";
import styles from "../Styles";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class HouseholdScreen extends React.Component<Props, any> {
  static navigationOptions = {
    title: "Household Composition and Exposure",
  };

  agesInput: any;
  numRoomsInput: any;
  householdSizeInput: any;

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
    smokerInHousehold: false,
  };
  render() {
    const residenceOptions = [
      { label: "House", value: 0 },
      { label: "Apartment", value: 1 },
      { label: "Shelter", value: 2 },
      { label: "None", value: 3 },
    ];
    const childCareOptions = [
      { label: "Yes, the participant", value: 0 },
      { label: "Yes, another child", value: 1 },
      { label: "No or not applicable", value: 2 },
    ];
    return (
      <ScreenView>
        <View style={styles.formLayout}>
          <Text>Which best describes your residence?</Text>
          <FieldLabel label="">
            <RadioButton
              options={residenceOptions}
              onPress={residenceType => {
                this.setState({ residenceType });
                this.householdSizeInput.focus();
              }}
            />
          </FieldLabel>
          <Text>How many individuals share your residence?</Text>
          <FieldLabel label="">
            <ValidatedInput
              inputType="nonNegativeInteger"
              myRef={(i: any) => {
                this.householdSizeInput = i;
              }}
              onChangeText={(householdSize: any) =>
                this.setState({ householdSize })
              }
              onSubmitEditing={() => {
                if (this.state.householdSize == 1) {
                  this.numRoomsInput.focus();
                }
              }}
            />
          </FieldLabel>
          {this.state.householdSize > 1 && (
            <View>
              <FieldLabel label="Their ages?">
                <ValidatedInput
                  inputType="text-short"
                  myRef={(i: any) => {
                    this.agesInput = i;
                  }}
                  placeholder="ex: 5,7,40"
                  autoFocus={true}
                  onChangeText={(householdAges: any) =>
                    this.setState({ householdAges })
                  }
                />
              </FieldLabel>
              <Text>
                Do any children attend a childcare setting or play group with at
                least 3 other children for 3 or more hours/day?
              </Text>
              <FieldLabel label="">
                <RadioButton
                  options={childCareOptions}
                  initial={2}
                  onPress={childCare => {
                    this.setState({ childCare });
                    this.numRoomsInput.focus();
                  }}
                />
              </FieldLabel>
            </View>
          )}
          <Text>
            How many rooms (excluding bathrooms) make up your residence?
          </Text>
          <FieldLabel label="">
            <ValidatedInput
              inputType="nonNegativeInteger"
              myRef={(i: any) => {
                this.numRoomsInput = i;
              }}
              onChangeText={(numRooms: any) => this.setState({ numRooms })}
            />
          </FieldLabel>
          <Text>
            Have you had pneumonia or other respiratory cold in the last year?
          </Text>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={respiratoryLastYear => {
                this.setState({ respiratoryLastYear });
              }}
            />
          </FieldLabel>
          <Text>Have any household contacts been ill in the last 4 weeks?</Text>
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
              <Text>Were they hospitalized?</Text>
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
          <Text>
            Have any household contacts travelled in the last 4 weeks?
          </Text>
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
              <Text>&nbsp;&nbsp;&nbsp; Outside of WA State</Text>
              <FieldLabel label="">
                <RadioButton
                  initial={1}
                  onPress={householdTravelOutsideWA => {
                    this.setState({ householdTravelOutsideWA });
                  }}
                />
              </FieldLabel>
              <Text>&nbsp;&nbsp;&nbsp; Outside of the United States</Text>
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
          <Text>Have you travelled in the last 4 weeks?</Text>
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
              <Text>&nbsp;&nbsp;&nbsp; Outside of WA State</Text>
              <FieldLabel label="">
                <RadioButton
                  initial={1}
                  onPress={travelOutsideWA => {
                    this.setState({ travelOutsideWA });
                  }}
                />
              </FieldLabel>
              <Text>&nbsp;&nbsp;&nbsp; Outside of the United States</Text>
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
          <Text>Do you or any household contacts smoke?</Text>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={smokerInHousehold => {
                this.setState({ smokerInHousehold });
              }}
            />
          </FieldLabel>
        </View>
        <Button
          title="NEXT"
          onPress={() => {
            goToNextScreen(this.props.navigation);
          }}
        />
      </ScreenView>
    );
  }
}
