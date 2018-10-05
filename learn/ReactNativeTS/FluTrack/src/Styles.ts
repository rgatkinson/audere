// Common styles go here

'use strict';

var React = require('react-native');

var {
  StyleSheet,
} = React;

module.exports = StyleSheet.create({
  screenView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkbox: {
    padding: 10,
    width: 200
  },
  picker: {
    height: 50,
    width: 300
  },
  slider: {
    height: 100,
    width: 300
  },
  inputField: {
    width: 80,
  },
  titleText: {
    fontSize: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 6,
    padding: 20
  },
  regularText: {
    fontSize: 15
  },
  largeText: {
    fontSize: 24
  },
  styledButton: {
    margin: 20,
    padding: 20,
    backgroundColor: '#36b3a8', // Audere button color
    borderRadius: 20,
    borderWidth: 0,
    height: 45,
    justifyContent: 'center'
  },
  headingText: {
    fontSize: 18,
    padding: 15
  },
  bold: {
    fontWeight: 'bold'
  },
  white: {
    color: 'white'
  },
  flexRow: {
    flexDirection: 'row'
  }

});
