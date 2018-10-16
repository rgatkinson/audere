import React from "react";
import { View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import Button from "./ui/Button";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import ValidatedInput from "./ValidatedInput";
import { connect } from "react-redux";
import { interact } from "../../App";
import styles from "../Styles";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  onNext: string;
  age: number;
}
function mapStateToProps(state: any) {
  return {
    age: state.age,
  };
}
class DemographicsScreen extends React.Component<Props, any> {
  render() {
    return (
      <ScreenView>
        <MyText size="heading">Demographics</MyText>
        <View style={styles.formLayout}>
          <FieldLabel label="Age:">
            <ValidatedInput
              inputType="nonNegativeInteger"
              defaultValue={this.props.age == 0 ? "" : this.props.age + ""}
              autoFocus={this.props.age == 0}
              max={150}
              onChangeText={age => this.setState({ age })}
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
              myRef={i => {
                this.homeInput = i;
              }}
              onChangeText={homeAddress => this.setState({ homeAddress })}
              onSubmitEditing={() => {
                this.workInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Work address:">
            <ValidatedInput
              inputType="address"
              optional={true}
              myRef={i => {
                this.workInput = i;
              }}
              onChangeText={workAddress => this.setState({ workAddress })}
              onSubmitEditing={() => {
                this.raceInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Race:">
            <ValidatedInput
              inputType="text-short"
              optional={true}
              myRef={i => {
                this.raceInput = i;
              }}
              onChangeText={race => this.setState({ race })}
              onSubmitEditing={() => {
                this.ethnicityInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Ethnicity:">
            <ValidatedInput
              inputType="text-short"
              optional={true}
              myRef={i => {
                this.ethnicityInput = i;
              }}
              onChangeText={ethnicity => this.setState({ ethnicity })}
            />
          </FieldLabel>
        </View>
        <Button
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

export default connect(mapStateToProps)(DemographicsScreen);
