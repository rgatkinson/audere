// Custom button that looks like the button on auderenow.org

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default class FTButton extends React.Component {
  render() {
    return(
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.5}
          onPress={this.props.onPress}
        >
          <Text style={{color: 'white', fontWeight:'bold'}}>{this.props.title}</Text>
        </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    margin: 20,
    padding:20,
    backgroundColor:'#36b3a8', // Audere button color
    borderRadius:20,
    borderWidth: 0,
    height: 45,
    justifyContent:'center'
  }
});