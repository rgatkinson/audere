import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { NavigationScreenProp } from "react-navigation";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class HeaderBar extends React.Component<Props> {

  _toHome= () => {
    // TODO: log cancellation, clear form
    Alert.alert(
      'Exit Survey?',
      'Returning to Home will discard all responses.',
      [
        { text: 'Discard', onPress: () => {
          this.props.navigation.popToTop();
        }, style: 'destructive'},
        { text: 'Continue', onPress: () => {}},
      ],
    );


  }

  _provideFeedback= () => {
    alert('TODO: feedback');
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._toHome} style={styles.actionContainer}>
          <Icon name='chevron-left' color='blue' size={24} type='feather' />
          <Text style={styles.actionText}>
            Return to Home 
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          Welcome 
        </Text>
        <TouchableOpacity onPress={this._provideFeedback}>
          <Text style={styles.actionText}>
            Provide Feedback
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: 'System',
    fontSize: 16,
    color: 'blue',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#DEDEDE',
    borderBottomColor: '#bbb',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
