import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Grid from "./Grid";
import Text from "./Text";
import {
  BORDER_COLOR,
  GUTTER,
  INPUT_HEIGHT,
  LINK_COLOR,
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
  exclusiveOption?: string;
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
  _onPressItem = (id: string) => {
    const dataItem = this.props.data.find(option => option.key === id);
    if (!!dataItem) {
      const toggled = !dataItem.selected;

      let data =
        !this.props.multiSelect || this.props.exclusiveOption === id
          ? emptyList(this.props.data.map(option => option.key))
          : this.props.data.slice(0);

      data = data.map(option => {
        if (
          this.props.inclusiveOption === id &&
          this.props.exclusiveOption !== option.key
        ) {
          return {
            key: option.key,
            selected: true,
          };
        }

        if (
          this.props.exclusiveOption === option.key &&
          this.props.exclusiveOption !== id
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

      if (
        this.props.exclusiveOption != null &&
        this.props.exclusiveOption !== id
      ) {
      }
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
        style={[styles.item, { width: this.props.width }]}
        onPress={this._onPress}
      >
        <Text
          content={this.props.t("surveyOption:" + this.props.id)}
          style={[styles.itemText, { width: this.props.width - 20 - GUTTER }]}
        />
        {this.props.selected && (
          <Feather name="check" color={LINK_COLOR} size={20} />
        )}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    alignItems: "flex-end",
    alignSelf: "stretch",
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexGrow: 1,
    height: INPUT_HEIGHT,
    justifyContent: "space-between",
    padding: GUTTER / 2,
  },
  itemText: {
    alignSelf: "flex-end",
    fontSize: SMALL_TEXT,
  },
});

const TranslatedListItem = withNamespaces()<ItemProps>(ListItem);
