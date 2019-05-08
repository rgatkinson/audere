// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Grid from "./Grid";
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

interface Option {
  key: string;
  selected: boolean;
}

interface Props {
  data: Option[];
  exclusiveOptions?: string[];
  highlighted?: boolean;
  inclusiveOption?: string;
  multiSelect: boolean;
  numColumns: number;
  style?: StyleProp<ViewStyle>;
  onChange(data: Option[]): void;
}

export const emptyList = (data: string[]) => {
  return data.map(option => {
    return {
      key: option,
      selected: false,
    };
  });
};

const newSelectedOptionsList = (
  options: string[],
  selected?: Option[]
): Option[] => {
  return selected ? selected.slice(0) : emptyList(options);
};

export { newSelectedOptionsList };

class OptionList extends React.Component<Props & WithNamespaces> {
  _isExclusive(id: string): boolean {
    return (this.props.exclusiveOptions || []).some(key => key === id);
  }

  _onPressItem = (id: string) => {
    const dataItem = this.props.data.find(option => option.key === id);
    if (!!dataItem) {
      const toggled = !dataItem.selected;

      let data =
        !this.props.multiSelect || this._isExclusive(id)
          ? emptyList(this.props.data.map(option => option.key))
          : this.props.data.slice(0);

      data = data.map(option => {
        if (
          this.props.inclusiveOption === id &&
          !this._isExclusive(option.key)
        ) {
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

        if (
          this.props.inclusiveOption === option.key &&
          this.props.inclusiveOption !== id
        ) {
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

      this.props.onChange(data);
    }
  };

  render() {
    const { t } = this.props;
    const totalOptions = this.props.data.length;
    const lastKey =
      totalOptions > 0
        ? this.props.data[this.props.data.length - 1].key
        : undefined;
    return (
      <Grid
        columns={this.props.numColumns}
        items={this.props.data}
        keyExtractor={item => item.key}
        renderItem={(item, width) => (
          <TranslatedListItem
            highlighted={this.props.highlighted}
            id={item.key}
            selected={item.selected}
            style={item.key === lastKey && styles.itemLast}
            width={width}
            onPressItem={this._onPressItem}
          />
        )}
        style={this.props.style}
      />
    );
  }
}
export default withNamespaces("optionList")(OptionList);

interface ItemProps {
  highlighted?: boolean;
  id: string;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  width: number;
  onPressItem(id: string): void;
}

const featherSize = 20;

class ListItem extends React.PureComponent<ItemProps & WithNamespaces> {
  _onPress = () => {
    this.props.onPressItem(this.props.id);
  };

  render() {
    const { highlighted, id, selected, t, width } = this.props;

    return (
      <TouchableOpacity
        style={[styles.item, { width }, this.props.style]}
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
          style={[
            styles.itemText,
            selected && styles.selectedItemText,
            { width: width - featherSize - GUTTER - GUTTER / 4 },
          ]}
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

const TranslatedListItem = withNamespaces()(ListItem);
