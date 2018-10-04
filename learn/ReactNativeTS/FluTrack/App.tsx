import React from 'react';
import { View, Text, Button, Alert, TextInput, Slider, Picker, Platform, Dimensions } from 'react-native';
import { createStackNavigator, NavigationEvents } from 'react-navigation';
import RadioForm, {RadioButton, RadioButtonInput, RadioButtonLabel} from 'react-native-simple-radio-button';
import CheckBox from 'react-native-check-box';
import { logInteraction } from './src/EventStore';
import FTButton from './src/components/FTButton';
import FTFieldLabel from './src/components/FTFieldLabel';
import FTScreenView from './src/components/FTScreenView';
import FTText from './src/components/FTText';

let x = 1;
function interact(data: string): Promise<void> {
  return logInteraction(data, x++);
}

global.navTrail="";
var styles = require('./src/styles.ts');
var pjson = require('./package.json');

class LoginScreen extends React.Component {
  constructor(props) {
    super(props);
    this.screenNum = '0';
    global.navTrail = global.navTrail + this.screenNum;
    var {height, width} = Dimensions.get('window');
    this.state = {
      id: "",
      password: "",
      navTrail: global.navTrail,
      deviceOS: Platform.OS,
      deviceVersion: Platform.Version,
      screenHeight: height,
      screenWidth: width,
    };
  }

  render() {
    return (
      <FTScreenView>
        <Text style={styles.titleText}>{pjson.name}&trade;</Text>
        <FTFieldLabel label="Login ID">
          <TextInput style={styles.inputfield}
                     autoFocus={true}
                     onChangeText={(id) => this.setState({id})}></TextInput>
        </FTFieldLabel>
        <FTFieldLabel label="Password">
          <TextInput style={styles.inputfield}
                     secureTextEntry={true}
                     onChangeText={(password) => this.setState({password})}></TextInput>
        </FTFieldLabel>

        <FTButton
          title="LOGIN"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('PatientInfo')} }
        />
      </FTScreenView>
    );
  }
}

class PatientInfoScreen extends React.Component {
  constructor(props) {
    super(props);
    const screenNum = '1';
    global.navTrail = global.navTrail + screenNum;
    this.state = {
      navTrail: global.navTrail
    };
  }
  render() {
    const sex_options = [
      {label: 'Male', value: 'M' },
      {label: 'Female', value: 'F' }
    ];
    return (
      <FTScreenView>
        <FTText style={styles.headingText}>Patient Info Screen</FTText>
        <FTText>Please tell us about the patient</FTText>
        <FTFieldLabel label="Age">
          <TextInput style={styles.inputfield}
                     autoFocus={true}
                     keyboardType="numeric"
                     onChangeText={(age) => this.setState({age})}></TextInput>
        </FTFieldLabel>
        <FTFieldLabel label="Sex">
          <RadioForm
            radio_props={sex_options}
            initial={0}
            buttonColor={'#36b3a8'}
            selectedButtonColor={'#36b3a8'}
            labelColor={'white'}
            selectedLabelColor={'white'}
            onPress={(sex) => {this.setState({sex})}}
          />
        </FTFieldLabel>
        <FTFieldLabel label="Medical History">
          <TextInput style={styles.inputfield}
                     multiline={true}
                     numberOfLines={4}
                     onChangeText={(history) => this.setState({history})}></TextInput>
        </FTFieldLabel>
        <FTButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('Fever')} }
        />
      </FTScreenView>
    );
  }
}

class FeverScreen extends React.Component {
  constructor(props) {
    super(props)
    const screenNum = '2';
    global.navTrail = global.navTrail + screenNum;
    this.state = {
      temp: 98,
      navTrail: global.navTrail
    }
  }
  render() {
    return (
      <FTScreenView>
        <FTText style={styles.headingText}>Fever Screen</FTText>
        <FTText>Tell us your temperature</FTText>
        <Slider
          style={styles.slider}
          minimumValue={96}
          maximumValue={106}
          step={0.5}
          value={this.state.temp}
          onValueChange={val => this.setState({temp: val})}
        />
        <FTText style={{fontSize: 24}}>
          {this.state.temp} &deg;F
        </FTText>
        <FTButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('Cough')} }
        />
      </FTScreenView>
    );
  }
}
class CoughScreen extends React.Component {
  constructor(props) {
    super(props)
    const screenNum = '3';
    global.navTrail = global.navTrail + screenNum;
    this.state = {
      coughSound: 0,
      navTrail: global.navTrail
    }
  }
  render() {
    return (
      <FTScreenView>
        <FTText style={styles.headingText}>Cough Screen</FTText>
        <FTText>What does your cough sound like?</FTText>
        <Picker
          selectedValue={this.state.coughSound}
          style={styles.picker}
          mode="dropdown"
          itemStyle={{color:'white', backgroundColor:'#222222'}}
          onValueChange={(itemValue, itemIndex) => this.setState({coughSound: itemValue})}>
          <Picker.Item label="Normal dry cough" color="white" value="0" />
          <Picker.Item label="Phlegmy" color="white" value="1" />
          <Picker.Item label="Wheezy" color="white" value="2" />
          <Picker.Item label="Lungs about to fall out" color="white" value="3" />
        </Picker>
        <FTButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('OtherSymptoms')} }
        />
      </FTScreenView>
    );
  }
}
class OtherSymptomsScreen extends React.Component {
  constructor(props) {
    super(props)
    const screenNum = '4';
    global.navTrail = global.navTrail + screenNum;
    this.state = {
      runnyNose: false,
      soreThroat: false,
      headache: false,
      muscleAche: false,
      vomiting: false,
      diarrhea: false,
      navTrail: global.navTrail
    }
  }
  render() {
    return (
      <FTScreenView>
        <FTText style={styles.headingText}>Other Symptoms Screen</FTText>
        <FTText>Please check all that apply</FTText>
        <CheckBox
          style={styles.checkbox}
          onClick={()=>{
            this.setState({
                runnyNose:!this.state.runnyNose
            })
          }}
          isChecked={this.state.runnyNose}
          rightText={"Runny Nose"}
          rightTextStyle={{color: 'white'}}
          checkBoxColor='white'
        />
        <CheckBox
          style={styles.checkbox}
          onClick={()=>{
            this.setState({
                soreThroat:!this.state.soreThroat
            })
          }}
          isChecked={this.state.soreThroat}
          rightText={"Sore Throat"}
          rightTextStyle={{color: 'white'}}
          checkBoxColor='white'
        />
        <CheckBox
          style={styles.checkbox}
          onClick={()=>{
            this.setState({
                headache:!this.state.headache
            })
          }}
          isChecked={this.state.headache}
          rightText={"Headache"}
          rightTextStyle={{color: 'white'}}
          checkBoxColor='white'
        />
        <CheckBox
          style={styles.checkbox}
          onClick={()=>{
            this.setState({
                muscleAche:!this.state.muscleAche
            })
          }}
          isChecked={this.state.muscleAche}
          rightText={"Muscle Ache"}
          rightTextStyle={{color: 'white'}}
          checkBoxColor='white'
        />
        <CheckBox
          style={styles.checkbox}
          onClick={()=>{
            this.setState({
                vomiting:!this.state.vomiting
            })
          }}
          isChecked={this.state.vomiting}
          rightText={"Vomiting"}
          rightTextStyle={{color: 'white'}}
          checkBoxColor='white'
        />
        <CheckBox
          style={styles.checkbox}
          onClick={()=>{
            this.setState({
                diarrhea:!this.state.diarrhea
            })
          }}
          isChecked={this.state.diarrhea}
          rightText={"Diarrhea"}
          rightTextStyle={{color: 'white'}}
          checkBoxColor='white'
        />
        <FTButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate('Submit')} }
        />
      </FTScreenView>
    );
  }
}
class SubmitScreen extends React.Component {
  constructor(props) {
    super(props)
    const screenNum = '5';
    global.navTrail = global.navTrail + screenNum;
    this.state = {
      navTrail: global.navTrail,
      consent: "true"
    }
  }
   render() {
     return (
       <FTScreenView>
         <FTText>Do you consent to participating in the study and giving up all privacy?</FTText>
         <FTButton
           title="YES"
           onPress={() => {
             interact(JSON.stringify(this.state));
             Alert.alert("Thank you for participating. Your info has been submitted."); }}
         />
         <FTButton
           title="NO"
           onPress={() => { Alert.alert("Wrong answer. Try again."); }}
         />
       </FTScreenView>
     );
   }
 }

const RootStack = createStackNavigator(
  {
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
