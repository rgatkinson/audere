import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Grid from "./Grid";
import Text from "./Text";
import {
  BORDER_COLOR,
  BORDER_RADIUS,
  DISABLED_COLOR,
  FONT_SEMI_BOLD,
  GUTTER,
  INPUT_HEIGHT,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  SMALL_TEXT,
} from "../styles";

interface Option {
  key: string;
  selected: boolean;
}

interface Props {
  data: Option[];
  multiSelect: boolean;
  numColumns: number;
  exclusiveOption?: string | string[];
  inclusiveOption?: string;
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
    if (Array.isArray(this.props.exclusiveOption)) {
      // Array.includes() only available starting es7
      let matched = false;
      this.props.exclusiveOption.forEach(key => {
        if (key === id) {
          matched = true;
        };
      });
      return matched;
    }
    return id === this.props.exclusiveOption;
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

        if (
          this._isExclusive(option.key) &&
          !this._isExclusive(id)
        ) {
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
    return (
      <Grid
        columns={this.props.numColumns}
        items={this.props.data}
        keyExtractor={item => item.key}
        renderItem={(item, width) => (
          <TranslatedListItem
            id={item.key}
            selected={item.selected}
            width={width}
            onPressItem={this._onPressItem}
          />
        )}
      />
    );
  }
}
export default withNamespaces("optionList")(OptionList);

interface ItemProps {
  id: string;
  selected: boolean;
  width: number;
  onPressItem(id: string): void;
}

class ListItem extends React.PureComponent<ItemProps & WithNamespaces> {
  _onPress = () => {
    this.props.onPressItem(this.props.id);
  };

  render() {
    return (
      <TouchableOpacity
        style={[
          styles.item,
          this.props.selected && styles.selectedItem,
          { width: this.props.width },
        ]}
        onPress={this._onPress}
      >
        <Feather
          name="check"
          color={this.props.selected ? SECONDARY_COLOR : DISABLED_COLOR}
          size={20}
        />
        <Text
          content={this.props.t("surveyOption:" + this.props.id)}
          style={[
            styles.itemText,
            this.props.selected && styles.selectedItemText,
            { width: this.props.width - 20 - 2 * GUTTER },
          ]}
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    alignSelf: "stretch",
    borderColor: BORDER_COLOR,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BORDER_RADIUS,
    flexDirection: "row",
    flexGrow: 1,
    height: INPUT_HEIGHT,
    marginBottom: GUTTER / 2,
    padding: GUTTER / 2,
  },
  itemText: {
    alignSelf: "center",
    fontSize: SMALL_TEXT,
    lineHeight: INPUT_HEIGHT - GUTTER,
    marginLeft: GUTTER / 2,
  },
  selectedItem: {
    borderColor: SECONDARY_COLOR,
  },
  selectedItemText: {
    color: SECONDARY_COLOR,
    fontFamily: FONT_SEMI_BOLD,
  },
});

const TranslatedListItem = withNamespaces()<ItemProps>(ListItem);
