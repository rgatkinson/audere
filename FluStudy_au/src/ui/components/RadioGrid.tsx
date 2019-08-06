// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment, RefObject } from "react";
import {
  Image,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { Action, updateAnswer, StoreState } from "../../store";
import { getSelectedButton } from "../../util/survey";
import { ButtonConfig, SurveyQuestion } from "audere-lib/coughQuestionConfig";
import {
  BORDER_WIDTH,
  GUTTER,
  HIGHLIGHT_STYLE,
  RADIO_BUTTON_HEIGHT,
  SMALL_TEXT,
  SECONDARY_COLOR,
  BORDER_COLOR,
  RADIO_INPUT_HEIGHT,
  FEATHER_SIZE,
} from "../styles";
import Text from "./Text";

interface Props {
  highlighted?: boolean;
  question: SurveyQuestion;
  style?: StyleProp<ViewStyle>;
  selected?: string;
  dispatch(action: Action): void;
}

class RadioGrid extends React.PureComponent<Props> {
  _onPress = (key: string) => {
    this.props.dispatch(
      updateAnswer({ selectedButtonKey: key }, this.props.question)
    );
  };

  render() {
    const { highlighted, selected, question } = this.props;
    return (
      <View style={styles.container}>
        {question.buttons.map((buttonConfig, i) => (
          <RadioGridItem
            config={buttonConfig}
            highlighted={!!highlighted}
            key={buttonConfig.key}
            last={question.buttons.length - 1 === i}
            selected={buttonConfig.key === selected}
            onPress={this._onPress}
          />
        ))}
      </View>
    );
  }
}
export default connect((state: StoreState, props: Props) => ({
  selected: getSelectedButton(state, props.question),
}))(RadioGrid);

interface ItemProps {
  config: ButtonConfig;
  highlighted: boolean;
  last: boolean;
  selected: boolean;
  onPress: (key: string) => void;
}

class Item extends React.Component<ItemProps & WithNamespaces> {
  shouldComponentUpdate(props: ItemProps & WithNamespaces) {
    return (
      props.selected != this.props.selected ||
      props.highlighted != this.props.highlighted
    );
  }

  _onPress = () => {
    this.props.onPress(this.props.config.key);
  };

  render() {
    const { config, highlighted, last, selected, t } = this.props;
    const { key, helpImageUri } = config;
    return (
      <Fragment>
        <TouchableOpacity
          onPress={this._onPress}
          style={[styles.radioRowButton, last && styles.radioRowButtonLast]}
        >
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioButton,
                selected && styles.selectedRadioColor,
                !!highlighted && HIGHLIGHT_STYLE,
              ]}
            >
              {selected && <View style={styles.radioButtonCenter} />}
            </View>
            <Text
              style={[styles.radioText, selected && styles.selectedRadioColor]}
              content={t(`surveyButton:${key}`)}
            />
          </View>
          {!!helpImageUri && (
            <View style={styles.imageContainer}>
              <Image
                key={`${key}-image`}
                resizeMode={"contain"}
                style={styles.helpImage}
                source={{ uri: helpImageUri }}
              />
            </View>
          )}
        </TouchableOpacity>
      </Fragment>
    );
  }
}
const RadioGridItem = withNamespaces()(Item);

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  helpImage: {
    flex: 1,
    height: undefined,
    marginVertical: GUTTER / 2,
    width: undefined,
  },
  imageContainer: {
    height: 200,
  },
  radioButton: {
    alignItems: "center",
    borderColor: BORDER_COLOR,
    borderWidth: BORDER_WIDTH,
    borderRadius: RADIO_INPUT_HEIGHT / 2,
    height: FEATHER_SIZE + GUTTER / 4,
    width: FEATHER_SIZE + GUTTER / 4,
  },
  radioButtonCenter: {
    backgroundColor: SECONDARY_COLOR,
    borderRadius: RADIO_INPUT_HEIGHT / 4,
    margin: RADIO_INPUT_HEIGHT / 4 - 1,
    height: RADIO_INPUT_HEIGHT / 2,
    width: RADIO_INPUT_HEIGHT / 2,
  },
  radioRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    paddingVertical: GUTTER / 2,
  },
  radioRowButton: {
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  radioRowButtonLast: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  radioText: {
    flex: 3,
    fontSize: SMALL_TEXT,
    marginLeft: GUTTER,
  },
  selectedRadioColor: {
    color: SECONDARY_COLOR,
    borderColor: SECONDARY_COLOR,
  },
});
