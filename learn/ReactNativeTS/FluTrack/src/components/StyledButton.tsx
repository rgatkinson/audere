// Custom button that looks like the button on auderenow.org

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
var styles = require('../Styles.ts');

export default class StyledButton extends React.Component {
  render() {
    return (
      <TouchableOpacity
        style={styles.styledButton}
        activeOpacity={0.5}
        onPress={this.props.onPress}
      >
        <Text style={[styles.bold, styles.white]}>{this.props.title}</Text>
      </TouchableOpacity>
    );
  }
}
