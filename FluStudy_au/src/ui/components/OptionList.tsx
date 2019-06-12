// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject } from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp, withNavigationFocus } from "react-navigation";
import { OptionQuestion, SurveyQuestion } from "../../resources/QuestionConfig";
import { Option } from "../../store/types";
import Text from "./Text";
import {
  BORDER_COLOR,
  BORDER_WIDTH,
  FONT_SEMI_BOLD,
  GUTTER,
  HIGHLIGHT_STYLE,
  INPUT_HEIGHT,
  RADIO_BUTTON_HEIGHT,
  SECONDARY_COLOR,
  SMALL_TEXT,
} from "../styles";

interface Props {
  question: OptionQuestion;
  highlighted?: boolean;
  isFocused: boolean;
  navigation: NavigationScreenProp<any, any>;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestion): void;
}

const emptyList = (data: string[]) =>
  data.map(option => {
    return {
      key: option,
      selected: false,
    };
  });

class OptionList extends React.Component<Props> {
  shouldComponentUpdate(props: Props) {
    return props.isFocused;
  }

  _isExclusive(id: string): boolean {
    return (this.props.question.exclusiveOptions || []).some(key => key === id);
  }

  _getData = () => {
    const { getAnswer, question } = this.props;
    const answer = getAnswer("options", question.id);
    return !!answer ? answer : emptyList(question.options);
  };

  _onPressItem = (id: string) => {
    const { updateAnswer, question } = this.props;
    const inclusiveOption = question.inclusiveOption;

    const dataItem = this._getData().find(
      (option: Option) => option.key === id
    );
    if (!!dataItem) {
      const toggled = !dataItem.selected;

      let data = this._isExclusive(id)
        ? emptyList(question.options)
        : this._getData().slice(0);

      data = data.map((option: Option) => {
        if (inclusiveOption === id && !this._isExclusive(option.key)) {
          return {
            key: option.key,
            selected: true,
          };
        }

        if (this._isExclusive(option.key) && !this._isExclusive(id)) {
          return {
            key: option.key,
            selected: false,
          };
        }

        if (inclusiveOption === option.key && inclusiveOption !== id) {
          return {
            key: option.key,
            selected: false,
          };
        }

        return {
          key: option.key,
          selected: option.key === id ? toggled : option.selected,
        };
      });

      updateAnswer({ options: data }, question);
    }
  };

  render() {
    const { highlighted, question } = this.props;
    const options = question.options;
    return (
      <View style={styles.container}>
        {this._getData().map((option: Option) => (
          <OptionItem
            highlighted={highlighted}
            id={option.key}
            key={option.key}
            selected={option.selected}
            style={
              option.key === options[options.length - 1] && styles.itemLast
            }
            onPressItem={this._onPressItem}
          />
        ))}
      </View>
    );
  }
}
export default withNavigationFocus(OptionList);

interface ItemProps {
  highlighted?: boolean;
  id: string;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  onPressItem(id: string): void;
}

const featherSize = 20;

class Item extends React.Component<ItemProps & WithNamespaces> {
  shouldComponentUpdate(props: ItemProps & WithNamespaces) {
    return (
      this.props.highlighted != props.highlighted ||
      this.props.selected != props.selected ||
      this.props.id != props.id
    );
  }

  _onPress = () => {
    this.props.onPressItem(this.props.id);
  };

  render() {
    const { highlighted, id, selected, t } = this.props;

    return (
      <TouchableOpacity
        style={[styles.item, this.props.style]}
        onPress={this._onPress}
      >
        <View
          style={[
            styles.checkbox,
            selected && styles.checkboxSelected,
            !!highlighted && HIGHLIGHT_STYLE,
          ]}
        >
          {selected && (
            <Feather name="check" color={"white"} size={featherSize} />
          )}
        </View>
        <Text
          content={t(`surveyOption:${id}`)}
          style={[styles.itemText, selected && styles.selectedItemText]}
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: "center",
    borderColor: BORDER_COLOR,
    borderWidth: BORDER_WIDTH,
    height: featherSize + GUTTER / 4,
    width: featherSize + GUTTER / 4,
  },
  checkboxSelected: {
    backgroundColor: SECONDARY_COLOR,
    borderColor: SECONDARY_COLOR,
  },
  container: {
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: GUTTER,
  },
  item: {
    alignItems: "center",
    alignSelf: "stretch",
    borderColor: BORDER_COLOR,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexGrow: 1,
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  itemLast: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    alignSelf: "center",
    fontSize: SMALL_TEXT,
    lineHeight: INPUT_HEIGHT - GUTTER,
    marginLeft: GUTTER,
  },
  selectedItemText: {
    color: SECONDARY_COLOR,
    fontFamily: FONT_SEMI_BOLD,
  },
});

const OptionItem = withNamespaces()(Item);
