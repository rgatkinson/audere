import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import ScreenContainer from "../../components/ScreenContainer";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class PassBackScreen extends React.PureComponent<Props> {
  _onDone = () => {
    this.props.navigation.push("Home");
  };

  render() {
    return (
      <ScreenContainer>
        <View style={styles.statusBar}>
          <Text style={styles.statusBarTitle}>Questionnaire complete!</Text>
        </View>
        <ContentContainer>
          <Title label="Please return this tablet to Seattle Flu Study Staff." />
          <Description content="They will assist you with the next step." />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  statusBar: {
    backgroundColor: "#E8E3D3",
    height: 90,
    justifyContent: "center",
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 2,
    shadowOpacity: 0.5,
  },
  statusBarTitle: {
    fontFamily: "OpenSans-Regular",
    fontSize: 20,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
});
