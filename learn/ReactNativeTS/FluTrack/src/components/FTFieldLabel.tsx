// Label that goes to the left of an input field, on same row
// Usage: Pass the actual input field through as child element

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FTText from './FTText';

export default class FTFieldLabel extends React.Component {
  render() {
    return(
        <View style={{flexDirection: 'row'}}>
          <FTText style={{width:80}}>{this.props.label}:</FTText>
          {this.props.children}
        </View>
    );
  }
}

const styles = StyleSheet.create({

});