import React from "react";
import { TextInput } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
var styles = require("../Styles.ts");

export default class DemographicsScreen extends React.Component {
  render() {
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Demographics</MyText>
        <FieldLabel label="Age:">
          <TextInput
            style={styles.inputField}
            keyboardType="numeric"
            onChangeText={age => this.setState({ age })}
          />
        </FieldLabel>
        <FieldLabel label="Address of residence:">
          <TextInput
            style={styles.wideInput}
            onChangeText={residence => this.setState({ residence })}
          />
        </FieldLabel>
        <FieldLabel label="Address of primary workplace:">
          <TextInput
            style={styles.wideInput}
            onChangeText={workplace => this.setState({ workplace })}
          />
        </FieldLabel>
        <FieldLabel label="Race:">
          <TextInput
            style={styles.inputField}
            onChangeText={race => this.setState({ race })}
          />
        </FieldLabel>
        <FieldLabel label="Ethnicity:">
          <TextInput
            style={styles.inputField}
            onChangeText={ethnicity => this.setState({ ethnicity })}
          />
        </FieldLabel>
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate("Household");
          }}
        />
      </ScreenView>
    );
  }
}
