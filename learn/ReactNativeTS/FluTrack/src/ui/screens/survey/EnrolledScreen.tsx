import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, setEmail, setEmailOptions } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import EmailInput from "../../components/EmailInput";
import OptionList from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import Title from "../../components/Title";

interface Props {
  dispatch(action: Action): void;
  email: string;
  options: Map<string, boolean>;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  email: state.form!.email,
  options: state.form!.emailOptions,
}))
export default class EnrolledScreen extends React.PureComponent<Props> {
  options = [
    "sendCopyOfMyConsent",
    "askAboutMyIllness",
    "learnAboutStudy",
    "allOfTheAbove",
  ];

  _onDone = () => {
    // TODO: write doc
    this.props.navigation.push("SurveyStart");
  };

  render() {
    return (
      <ScreenContainer>
        <View style={styles.statusBar}>
          <Text style={styles.statusBarTitle}>Enrollment complete!</Text>
        </View>
        <ContentContainer>
          <Title label="We would like to email you." />
          <Description content="Please select when we may email you, and provide your email address (optional)." />
          <OptionList
            data={
              this.props.options
                ? this.props.options
                : OptionList.emptyMap(this.options)
            }
            multiSelect={true}
            numColumns={1}
            onChange={options => this.props.dispatch(setEmailOptions(options))}
          />
          <EmailInput
            returnKeyType="done"
            value={this.props.email && this.props.email}
            onChange={text => this.props.dispatch(setEmail(text))}
            onSubmit={this._onDone}
          />
          <Button
            primary={true}
            enabled={true}
            label="Done"
            onPress={this._onDone}
          />
          <Button
            primary={false}
            enabled={true}
            label="Please do not email me"
            onPress={() => {
              this.props.dispatch(
                setEmailOptions(OptionList.emptyMap(this.options))
              );
              this._onDone();
            }}
          />
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
