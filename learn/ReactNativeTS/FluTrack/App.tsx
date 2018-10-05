import React from 'react';
import { View, Text, Button, Alert, TextInput, Slider, Picker, Platform, Dimensions } from 'react-native';
import { createStackNavigator, NavigationEvents } from 'react-navigation';
import RadioForm, { RadioButton, RadioButtonInput, RadioButtonLabel } from 'react-native-simple-radio-button';
import CheckBox from 'react-native-check-box';
import { logInteraction } from './src/EventStore';
import StyledButton from './src/components/StyledButton';
import FieldLabel from './src/components/FieldLabel';
import ScreenView from './src/components/ScreenView';
import MyText from './src/components/MyText';

let x = 1;
function interact(data: string): Promise<void> {
  return logInteraction(data, x++);
}

var styles = require('./src/Styles.ts');
var pjson = require('./package.json');

class LoginScreen extends React.Component {
  constructor(props) {
    super(props);
    var { height, width } = Dimensions.get('window');
    this.state = {
      id: "",
      password: "",
      deviceOS: Platform.OS,
      deviceVersion: Platform.Version,
      screenHeight: height,
      screenWidth: width,
    };
  }

  render() {
    return (
      <ScreenView>
        <Text style={styles.titleText}>{pjson.name}&trade;</Text>
        <FieldLabel label="Login ID">
          <TextInput style={styles.inputField}
            autoFocus={true}
            onChangeText={(id) => this.setState({ id })}></TextInput>
        </FieldLabel>
        <FieldLabel label="Password">
          <TextInput style={styles.inputField}
            secureTextEntry={true}
            onChangeText={(password) => this.setState({ password })}></TextInput>
        </FieldLabel>

        <StyledButton
          title="LOGIN"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('PatientInfo')
          }}
        />
      </ScreenView>
    );
  }
}

class PatientInfoScreen extends React.Component {
  render() {
    const sex_options = [
      { label: 'Male', value: 'M' },
      { label: 'Female', value: 'F' }
    ];
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Patient Info Screen</MyText>
        <MyText>Please tell us about the patient</MyText>
        <FieldLabel label="Age">
          <TextInput style={styles.inputField}
            autoFocus={true}
            keyboardType="numeric"
            onChangeText={(age) => this.setState({ age })}></TextInput>
        </FieldLabel>
        <FieldLabel label="Sex">
          <RadioForm
            radio_props={sex_options}
            initial={0}
            buttonColor={'#36b3a8'}
            selectedButtonColor={'#36b3a8'}
            onPress={(sex) => { this.setState({ sex }) }}
          />
        </FieldLabel>
        <FieldLabel label="Medical History">
          <TextInput style={styles.inputField}
            multiline={true}
            numberOfLines={4}
            onChangeText={(history) => this.setState({ history })}></TextInput>
        </FieldLabel>
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('Fever')
          }}
        />
      </ScreenView>
    );
  }
}

class FeverScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      temp: 98,
    }
  }
  render() {
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Fever Screen</MyText>
        <MyText>Tell us your temperature</MyText>
        <Slider
          style={styles.slider}
          minimumValue={96}
          maximumValue={106}
          step={0.5}
          value={this.state.temp}
          onValueChange={val => this.setState({ temp: val })}
        />
        <MyText style={styles.largeText}>
          {this.state.temp} &deg;F
        </MyText>
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('Cough')
          }}
        />
      </ScreenView>
    );
  }
}
class CoughScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      coughSound: 0,
    }
  }
  render() {
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Cough Screen</MyText>
        <MyText>What does your cough sound like?</MyText>
        <Picker
          selectedValue={this.state.coughSound}
          style={styles.picker}
          mode="dropdown"
          onValueChange={(itemValue, itemIndex) => this.setState({ coughSound: itemValue })}>
          <Picker.Item label="Normal dry cough" value="0" />
          <Picker.Item label="Phlegmy" value="1" />
          <Picker.Item label="Wheezy" value="2" />
          <Picker.Item label="Lungs about to fall out" value="3" />
        </Picker>
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('OtherSymptoms')
          }}
        />
      </ScreenView>
    );
  }
}
class OtherSymptomsScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      runnyNose: false,
      soreThroat: false,
      headache: false,
      muscleAche: false,
      vomiting: false,
      diarrhea: false,
    }
  }
  render() {
    return (
      <ScreenView>
        <MyText style={styles.headingText}>Other Symptoms Screen</MyText>
        <MyText>Please check all that apply</MyText>
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              runnyNose: !this.state.runnyNose
            })
          }}
          isChecked={this.state.runnyNose}
          rightText={"Runny Nose"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              soreThroat: !this.state.soreThroat
            })
          }}
          isChecked={this.state.soreThroat}
          rightText={"Sore Throat"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              headache: !this.state.headache
            })
          }}
          isChecked={this.state.headache}
          rightText={"Headache"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              muscleAche: !this.state.muscleAche
            })
          }}
          isChecked={this.state.muscleAche}
          rightText={"Muscle Ache"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              vomiting: !this.state.vomiting
            })
          }}
          isChecked={this.state.vomiting}
          rightText={"Vomiting"}
        />
        <CheckBox
          style={styles.checkbox}
          onClick={() => {
            this.setState({
              diarrhea: !this.state.diarrhea
            })
          }}
          isChecked={this.state.diarrhea}
          rightText={"Diarrhea"}
        />
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('Submit')
          }}
        />
      </ScreenView>
    );
  }
}
class SubmitScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      consent: "true"
    }
  }
  render() {
    return (
      <ScreenView>
        <MyText>Do you consent to participating in the study and giving up all privacy?</MyText>
        <StyledButton
          title="YES"
          onPress={() => {
            interact(JSON.stringify(this.state));
            Alert.alert("Thank you for participating. Your info has been submitted.");
          }}
        />
        <StyledButton
          title="NO"
          onPress={() => {
            Alert.alert("Wrong answer. Try again.");
          }}
        />
      </ScreenView>
    );
  }
}

const RootStack = createStackNavigator({
  Login: LoginScreen,
  PatientInfo: PatientInfoScreen,
  Fever: FeverScreen,
  Cough: CoughScreen,
  OtherSymptoms: OtherSymptomsScreen,
  Submit: SubmitScreen,
},
  {
    initialRouteName: 'Login',
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}
