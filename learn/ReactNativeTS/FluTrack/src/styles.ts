// Common styles go here

'use strict';

var React = require('react-native');

var {
  StyleSheet,
} = React;

module.exports = StyleSheet.create({
  checkbox: {
    padding: 10,
    width: 200,
  },
  picker: {
    height: 50,
    width: 300
  },
  slider: {
    width: 300,
    height: 100
  },
  inputfield: {
    width: 80,
    color: 'white'
  },
  titleText: {
    fontSize: 30,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -5, height: 5},
    textShadowRadius: 10,
    padding:20
  },
  regularText: {
    color: 'white',
    fontSize: 15
  },
  headingText: {
    fontSize: 18,
    padding: 15
  },

});