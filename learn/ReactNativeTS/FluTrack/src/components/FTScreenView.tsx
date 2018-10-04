import React from 'react';
import { StyleSheet, ImageBackground, View, Text } from 'react-native';

export default class FTScreenView extends React.Component {
  render() {
    return(
      <View style={styles.view}>
        <ImageBackground
          source={require ('../img/blueatombg.png')}
          style={[{width:'100%'}, styles.view]}>
            {this.props.children}
        </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});