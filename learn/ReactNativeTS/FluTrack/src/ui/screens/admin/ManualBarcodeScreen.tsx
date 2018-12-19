// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import {
  Action,
  Sample,
  StoreState,
  setSamples,
} from "../../../store";
import Button from "../../components/Button";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import TextInput from "../../components/TextInput";
import ScreenContainer from "../../components/ScreenContainer";

interface Props {
  name: string;
  navigation: NavigationScreenProp<any, any>;
  samples: Sample[];
  dispatch(action: Action): void;
}

@connect((state: StoreState) => ({
  name: state.form.name,
  samples: state.form.samples,
}))
export default class ManualBarcodeScreen extends React.Component<Props> {
  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<any, any>}) => {
    const { params = null } = navigation.state;
    return {
      title: "Manual Barcode Entry",
      headerBackTitle: "Cancel",
      headerRight: (!!params ?
        <FeedbackButton onPress={params.showFeedback} />
        : null
      ),
    };
  };

  state = {
    barcode1: null,
    barcode2: null,
    feedbackVisible: false,
  };

  componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
  }

  _onSave = () => {
    if (!!this.state.barcode1 && this.state.barcode1 === this.state.barcode2) {
      Alert.alert(
        "Submit?",
        `Bar code with data ${this.state.barcode1} will be recorded for ${this.props.name}.`,
        [
          {
            text: "Cancel",
            onPress: () => {},
          },
          {
            text: "OK",
            onPress: () => {
              const samples = !!this.props.samples ? this.props.samples.slice(0) : [];
              samples.push({ sampleType: 'manualBarcodeEntry', code: this.state.barcode1! });
              this.props.dispatch(setSamples(samples));
              this.props.navigation.popToTop();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Error",
        `Barcode values don't match`,
        [
          {
            text: "OK",
            onPress: () => {},
          },
        ],
      );
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
            autoFocus={true}
            placeholder="Enter barcode data"
            returnKeyType="next"
            value={this.state.barcode1}
            onChangeText={(text: string) => {
              this.setState({ barcode1: text })
            }}
          />
          <TextInput
            placeholder="Confirm barcode data"
            returnKeyType="done"
            value={this.state.barcode2}
            onChangeText={(text: string) => {
              this.setState({ barcode2: text })
            }}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    margin: 15,
  },
});
