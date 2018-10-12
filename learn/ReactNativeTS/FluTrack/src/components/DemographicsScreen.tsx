import React from "react";
import { TextInput, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
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
    age: state.age
  };
}
class DemographicsScreen extends React.Component<Props, any> {
  render() {
    return (
      <ScreenView>
        <MyText size="heading">Demographics</MyText>
        <View style={styles.formLayout}>
          <FieldLabel label="Age:">
            <TextInput
              style={styles.inputField}
              defaultValue={this.props.age == 0 ? "" : this.props.age + ""}
              autoFocus={this.props.age == 0}
              keyboardType="numeric"
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={age => this.setState({ age })}
              onSubmitEditing={() => {
                this.homeInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Home address:">
            <TextInput
              style={styles.wideInput}
              ref={i => {
                this.homeInput = i;
              }}
              underlineColorAndroid="rgba(0,0,0,0)"
              autoFocus={this.props.age !== 0}
              onChangeText={homeAddress => this.setState({ homeAddress })}
              onSubmitEditing={() => {
                this.workInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Work address:">
            <TextInput
              style={styles.wideInput}
              ref={i => {
                this.workInput = i;
              }}
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={workAddress => this.setState({ workAddress })}
              onSubmitEditing={() => {
                this.raceInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Race:">
            <TextInput
              style={styles.inputField}
              ref={i => {
                this.raceInput = i;
              }}
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={race => this.setState({ race })}
              onSubmitEditing={() => {
                this.ethnicityInput.focus();
              }}
            />
          </FieldLabel>
          <FieldLabel label="Ethnicity:">
            <TextInput
              style={styles.inputField}
              ref={i => {
                this.ethnicityInput = i;
              }}
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={ethnicity => this.setState({ ethnicity })}
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

export default connect(mapStateToProps)(DemographicsScreen);
