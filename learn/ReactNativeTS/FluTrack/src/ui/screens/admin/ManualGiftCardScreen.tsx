// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import { Action, StoreState, setGiftcards } from "../../../store";
import { GiftCardInfo } from "audere-lib";
import BackButton from "../../components/BackButton";
import Button from "../../components/Button";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import TextInput from "../../components/TextInput";
import ScreenContainer from "../../components/ScreenContainer";

interface Props {
  giftcards: GiftCardInfo[];
  name: string;
  navigation: NavigationScreenProp<any, any>;
  dispatch(action: Action): void;
}

@connect((state: StoreState) => ({
  name: state.form.name,
  giftcards: state.form.giftcards,
}))
export default class ManualGiftCardScreen extends React.Component<Props> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<any, any>;
  }) => {
    const { params = null } = navigation.state;
    return {
      title: "Manual Gift Card Entry",
      headerLeft: <BackButton navigation={navigation} text={"Cancel"} />,
      headerRight: !!params ? (
        <FeedbackButton onPress={params.showFeedback} />
      ) : null,
    };
  };

  state = {
    barcode1: null,
    barcode2: null,
    feedbackVisible: false,
  };

  confirmInput = React.createRef<TextInput>();

  componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
  }

  _onSave = () => {
    if (!!this.state.barcode1 && this.state.barcode1 === this.state.barcode2) {
      Alert.alert(
        "Submit?",
        `Gift Card with data ${this.state.barcode1} will be recorded for ${
          this.props.name
        }.`,
        [
          {
            text: "Cancel",
            onPress: () => {},
          },
          {
            text: "OK",
            onPress: () => {
              const giftcards = !!this.props.giftcards
                ? this.props.giftcards.slice(0)
                : [];
              giftcards.push({
                barcodeType: "manualGiftCardEntry",
                code: this.state.barcode1!,
                giftcardType: this.props.navigation.getParam("giftcardType"),
              });
              this.props.dispatch(setGiftcards(giftcards));
              this.props.navigation.popToTop();
            },
          },
        ]
      );
    } else {
      Alert.alert("Error", `Gift card barcode values don't match`, [
        {
          text: "OK",
          onPress: () => {},
        },
      ]);
    }
  };

  render() {
    return (
      <ScreenContainer>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        <View style={styles.inputContainer}>
          <TextInput
            autoCorrect={false}
            autoFocus={true}
            placeholder="Enter gift card barcode"
            returnKeyType="next"
            value={this.state.barcode1}
            onChangeText={(text: string) => {
              this.setState({ barcode1: text });
            }}
            onSubmitEditing={() => this.confirmInput.current!.focus()}
          />
          <TextInput
            placeholder="Confirm gift code barcode"
            ref={this.confirmInput}
            returnKeyType="done"
            value={this.state.barcode2}
            onChangeText={(text: string) => {
              this.setState({ barcode2: text });
            }}
            onSubmitEditing={this._onSave}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            enabled={!!this.state.barcode1 && !!this.state.barcode2}
            key="save"
            label="Save"
            primary={true}
            onPress={this._onSave}
          />
        </View>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    margin: 15,
  },
});
