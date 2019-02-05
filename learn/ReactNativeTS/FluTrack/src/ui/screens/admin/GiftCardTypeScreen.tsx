// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Text, StyleSheet, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { Option } from "../../../store";
import BackButton from "../../components/BackButton";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import OptionList from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";
import Button from "../../components/Button";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
}

interface State {
  feedbackVisible: boolean;
  options: Option[];
  other: string | null;
}

export default class GiftCardTypeScreen extends React.Component<Props, State> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<any, any>;
  }) => {
    const { params = null } = navigation.state;
    return {
      title: "Gift Card",
      headerLeft: (
        <BackButton navigation={navigation} text={"Admin Settings"} />
      ),
      headerRight: !!params ? (
        <FeedbackButton onPress={params.showFeedback} />
      ) : null,
    };
  };

  state = {
    feedbackVisible: false,
    options: [
      {
        key: "Starbucks",
        selected: false,
      },
      {
        key: "Amazon",
        selected: false,
      },
      {
        key: "Subway",
        selected: false,
      },
      {
        key: "Target",
        selected: false,
      },
      {
        key: "Other",
        selected: false,
      },
    ],
    other: null,
  };

  componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
  }

  _getOption = (): string | null => {
    const selected = this.state.options.filter(option => option.selected);
    if (selected.length === 0) {
      return null;
    }
    const selectedOption = selected[0].key;
    if (selectedOption === "Other") {
      return this.state.other;
    }
    return selectedOption;
  };

  render() {
    return (
      <ScreenContainer>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        <Text style={styles.sectionHeaderText}>Type of Gift Card</Text>
        <OptionList
          backgroundColor="#fff"
          data={this.state.options}
          fullWidth={true}
          multiSelect={false}
          numColumns={1}
          withOther={true}
          otherPlaceholder="Card type"
          onChange={options => this.setState({ options })}
          onOtherChange={other => this.setState({ other })}
        />
        <View style={styles.buttonContainer}>
          <Button
            enabled={this._getOption() !== null}
            key="next"
            label="Next"
            primary={true}
            onPress={() => {
              this.props.navigation.push("GiftCard", {
                giftcardType: this._getOption(),
              });
            }}
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
  sectionHeaderText: {
    marginTop: 35,
    marginBottom: 7,
    marginLeft: 15,
    fontSize: 24,
  },
});
