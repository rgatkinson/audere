import React from "react";
import { View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import Button from "../components/Button";
import FieldLabel from "../components/FieldLabel";
import ScreenView from "../components/ScreenView";
import ValidatedInput from "../components/ValidatedInput";
import { connect } from "react-redux";
import { goToNextScreen } from "../../../App";
import styles from "../Styles";
import { StoreState } from "../../store/index";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  age: number;
}

@connect((state: StoreState) => ({ age: state.form!.age }))
export default class DemographicsScreen extends React.Component<Props, any> {
  static navigationOptions = {
    title: "Demographics",
  };

  homeInput: any;
  workInput: any;
  raceInput: any;
  ethnicityInput: any;

  render() {
    return (
      <ScreenView>
        <View style={styles.formLayout}>
          <FieldLabel label="Age:">
            <ValidatedInput
              inputType="nonNegativeInteger"
              defaultValue={this.props.age == 0 ? "" : this.props.age + ""}
              autoFocus={this.props.age == 0}
              max={150}
              onChangeText={(age: any) => this.setState({ age })}
              onSubmitEditing={() => {
                this.homeInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Home address:">
            <ValidatedInput
              inputType="address"
              optional={true}
              autoFocus={this.props.age != 0}
              myRef={(i: any) => {
                this.homeInput = i;
              }}
              onChangeText={(homeAddress: string) => this.setState({ homeAddress })}
              onSubmitEditing={() => {
                this.workInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Work address:">
            <ValidatedInput
              inputType="address"
              optional={true}
              myRef={(i: any) => {
                this.workInput = i;
              }}
              onChangeText={(workAddress: string) => this.setState({ workAddress })}
              onSubmitEditing={() => {
                this.raceInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Race:">
            <ValidatedInput
              inputType="text-short"
              optional={true}
              myRef={(i: any) => {
                this.raceInput = i;
              }}
              onChangeText={(race: string) => this.setState({ race })}
              onSubmitEditing={() => {
                this.ethnicityInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Ethnicity:">
            <ValidatedInput
              inputType="text-short"
              optional={true}
              myRef={(i: any) => {
                this.ethnicityInput = i;
              }}
              onChangeText={(ethnicity: any) => this.setState({ ethnicity })}
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
