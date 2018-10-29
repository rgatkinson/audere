import React from "react";
import { StyleSheet, View } from "react-native";
import Button from "../components/Button";
import CheckBox from "../components/CheckBox";
import DatePicker from "../components/DatePicker";
import FieldLabel from "../components/FieldLabel";
import RadioButton from "../components/RadioButton";
import ScreenView from "../components/ScreenView";
import Text from "../components/Text";
import ValidatedInput from "../components/ValidatedInput";
import { NavigationScreenProp } from "react-navigation";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class ComponentLibraryScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Component Library",
  };

  state = {
    checked: false,
    date: new Date(),
  };

  // TODO: ValidatedInput example not fully-functional
  
  render() {
    return (
      <ScreenView>
        <Button title="Button" style={styles.component} onPress={() => {}} />
        <CheckBox
          style={styles.component}
          text="CheckBox"
          isChecked={this.state.checked}
          onClick={() => this.setState({ checked: !this.state.checked })}
        />
        <View style={styles.component}>
          <Text>DatePicker</Text>
          <DatePicker
            date={this.state.date}
            onDateChange={date => { this.setState({ date }) }}
          />
        </View>
        <FieldLabel label="Field Label"  style={styles.component} />
        <View style={styles.component}>
          <Text>Radio Button</Text>
          <RadioButton onPress={(arg) => {}} />
        </View>
        <Text style={styles.component}>Text</Text>
        <View style={styles.component}>
          <Text>Validated Input</Text>
          <ValidatedInput inputType="email" onChangeText={text => {}} />
        </View>
      </ScreenView>
    );
  }
}

const styles = StyleSheet.create({
  component: {
    padding: 20,
  },
});
