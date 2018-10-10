import React from "react";
import { TextInput, View } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import ScreenView from "./ScreenView";
import MyText from "./MyText";
import { interact } from "../../App";
import styles from "../Styles";

export default class DemographicsScreen extends React.Component {
  render() {
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Demographics</MyText>
        <View style={styles.formLayout}>
          <FieldLabel label="Age:">
            <TextInput
              style={styles.inputField}
              keyboardType="numeric"
              autoFocus={true}
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={age => this.setState({ age })}
            />
          </FieldLabel>
          <FieldLabel label="Home address:">
            <TextInput
              style={styles.wideInput}
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={homeAddress => this.setState({ homeAddress })}
            />
          </FieldLabel>
          <FieldLabel label="Work address:">
            <TextInput
              style={styles.wideInput}
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={workAddress => this.setState({ workAddress })}
            />
          </FieldLabel>
          <FieldLabel label="Race:">
            <TextInput
              style={styles.inputField}
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={race => this.setState({ race })}
            />
          </FieldLabel>
          <FieldLabel label="Ethnicity:">
            <TextInput
              style={styles.inputField}
              underlineColorAndroid="rgba(0,0,0,0)"
              onChangeText={ethnicity => this.setState({ ethnicity })}
            />
          </FieldLabel>
        </View>
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
