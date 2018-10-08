import React from 'react';
import { Text, TextInput, Platform, Dimensions } from 'react-native';
import StyledButton from './StyledButton';
import FieldLabel from './FieldLabel';
import ScreenView from './ScreenView';
import { interact } from '../../App';
var styles = require('../Styles.ts');
var pjson = require('../../package.json');

export default class LoginScreen extends React.Component {
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
            this.props.navigation.navigate('Screening')
          }}
        />
      </ScreenView>
    );
  }
}
