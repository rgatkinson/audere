import React from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Grid from "./Grid";
import Text from "./Text";
import {
  BORDER_COLOR,
  BORDER_RADIUS,
  BORDER_WIDTH,
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
  exclusiveOptions?: string[];
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
  _animatedValue = new Animated.Value(0);

  _onPress = () => {
    this.props.onPressItem(this.props.id);
    if (!this.props.selected) {
      this._animatedValue.setValue(0);
      Animated.timing(this._animatedValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.bezier(0, 0.75, 0.75, 3),
      }).start();
    }
  };

  render() {
    const marginLeft = this._animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, GUTTER / 2],
    });
    return (
      <TouchableOpacity
        style={[
          styles.item,
          this.props.selected && styles.selectedItem,
          { width: this.props.width },
        ]}
        onPress={() => this._onPress()}
      >
        {this.props.selected && (
          <Feather name="check" color={SECONDARY_COLOR} size={20} />
        )}
        <Animated.View style={{ marginLeft }}>
          <Text
            content={this.props.t("surveyOption:" + this.props.id)}
            style={[
              styles.itemText,
              this.props.selected && styles.selectedItemText,
              { width: this.props.width - 20 - 2 * GUTTER },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
    alignSelf: "stretch",
    borderColor: BORDER_COLOR,
    borderWidth: BORDER_WIDTH,
    borderRadius: BORDER_RADIUS,
    flexDirection: "row",
    flexGrow: 1,
    marginBottom: GUTTER / 2,
    padding: GUTTER / 2,
  },
  itemText: {
    alignSelf: "center",
    fontSize: SMALL_TEXT,
    lineHeight: INPUT_HEIGHT - GUTTER,
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
