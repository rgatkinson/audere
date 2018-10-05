import React from 'react';
import { ImageBackground, View } from 'react-native';
var styles = require('../Styles.ts');

export default class ScreenView extends React.Component {
  render() {
    return (
      <View style={styles.screenView}>
        {this.props.children}
      </View>
    );
  }
}
