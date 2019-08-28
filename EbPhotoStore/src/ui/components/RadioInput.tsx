// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  BORDER_WIDTH,
  GUTTER,
  RADIO_BUTTON_HEIGHT,
  SMALL_TEXT,
  RADIO_INPUT_HEIGHT,
  FEATHER_SIZE,
  HIGHLIGHT_COLOR,
  TEXT_COLOR,
} from "../styles";
import Text from "./Text";

interface Props {
  options: string[];
  style?: StyleProp<ViewStyle>;
  textContent?: string;
  textStyle?: StyleProp<TextStyle>;
  selected?: string;
  namespace?: string;
  onSelect(answer: string): void;
}

interface State {
  expandedHelpImage: string | null;
}

class RadioInput extends React.PureComponent<Props, State> {
  state: State = {
    expandedHelpImage: null,
  };

  _onPress = (key: string) => {
    this.props.onSelect(key);
  };

  render() {
    const { selected, namespace, options, textContent, textStyle } = this.props;
    return (
      <View style={styles.container}>
        {!!textContent && <Text content={textContent} style={textStyle} />}
        {options.map((option, i) => (
          <RadioGridItem
            option={option}
            key={option}
            namespace={namespace}
            selected={option === selected}
            onPress={this._onPress}
          />
        ))}
      </View>
    );
  }
}
export default RadioInput;

interface ItemProps {
  namespace?: string;
  option: string;
  selected: boolean;
  onPress: (key: string) => void;
}

class Item extends React.Component<ItemProps & WithNamespaces> {
  shouldComponentUpdate(props: ItemProps & WithNamespaces) {
    return props.selected != this.props.selected;
  }

  _onPress = () => {
    this.props.onPress(this.props.option);
  };

  render() {
    const { namespace, option, selected, t } = this.props;
    return (
      <Fragment>
        <TouchableOpacity onPress={this._onPress} style={styles.radioRowButton}>
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioButton,
                selected && styles.selectedRadioColor,
              ]}
            >
              {selected && <View style={styles.radioButtonCenter} />}
            </View>
            <Text
              style={styles.radioText}
              bold={selected}
              content={t(`${namespace + ":" || ""}${option}`)}
            />
          </View>
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

  radioButton: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: TEXT_COLOR,
    borderWidth: BORDER_WIDTH,
    borderRadius: RADIO_INPUT_HEIGHT / 2,
    height: FEATHER_SIZE + GUTTER / 4,
    width: FEATHER_SIZE + GUTTER / 4,
  },
  radioButtonCenter: {
    backgroundColor: HIGHLIGHT_COLOR,
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
    minHeight: RADIO_BUTTON_HEIGHT,
  },
  radioText: {
    flex: 3,
    fontSize: SMALL_TEXT,
    marginLeft: GUTTER,
  },
  selectedRadioColor: {
    color: TEXT_COLOR,
    borderColor: HIGHLIGHT_COLOR,
    borderWidth: 3,
  },
});
