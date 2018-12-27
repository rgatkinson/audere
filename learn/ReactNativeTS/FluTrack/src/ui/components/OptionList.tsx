import React from "react";
import {
  Dimensions,
  FlatList,
  LayoutAnimation,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Description from "./Description";

interface Option {
  key: string;
  selected: boolean;
}

interface Props {
  data: Option[];
  multiSelect: boolean;
  numColumns: number;
  withOther?: boolean;
  otherOption?: string | null;
  onChange(data: Option[]): void;
  onOtherChange?(value: string): void;
  fullWidth?: boolean;
  backgroundColor?: string;
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

      let data = this.props.multiSelect
        ? this.props.data.slice(0)
        : emptyList(this.props.data.map(option => option.key));

      data = data.map(option => {
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
    const marginHorizontal = this.props.fullWidth ? 0 : 50;
    const itemWidth =
      (Dimensions.get("window").width -
        2 * marginHorizontal -
        this.props.numColumns * 20) /
      this.props.numColumns;
    const totalHeight =
      Math.ceil(this.props.data.length / this.props.numColumns) * 44;

    return (
      <View style={styles.container}>
        <View style={{ height: totalHeight }}>
          <FlatList
            data={this.props.data}
            numColumns={this.props.numColumns}
            scrollEnabled={false}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TranslatedListItem
                id={item.key}
                selected={item.selected}
                width={itemWidth}
                smallText={
                  this.props.data.length > 12 && this.props.numColumns > 1
                }
                backgroundColor={this.props.backgroundColor}
                onPressItem={this._onPressItem}
              />
            )}
          />
        </View>
        {this.props.withOther &&
          !!this.props.data.find(option => option.key === "other") &&
          this.props.data.find(option => option.key === "other")!.selected && (
            <View>
              <Description content={t("pleaseSpecify")} />
              <View style={styles.item}>
                <TextInput
                  autoFocus={true}
                  style={styles.itemText}
                  returnKeyType="done"
                  value={
                    this.props.otherOption ? this.props.otherOption : undefined
                  }
                  onChangeText={this.props.onOtherChange}
                />
              </View>
            </View>
          )}
      </View>
    );
  }
}
export default withNamespaces("optionList")(OptionList);

interface ItemProps {
  id: string;
  selected: boolean;
  width: number;
  smallText?: boolean;
  backgroundColor?: string;
  onPressItem(id: string): void;
}

class ListItem extends React.PureComponent<ItemProps & WithNamespaces> {
  _onPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.props.onPressItem(this.props.id);
  };

  render() {
    return (
      <TouchableOpacity
        style={[
          styles.item,
          { width: this.props.width },
          { backgroundColor: this.props.backgroundColor },
        ]}
        onPress={this._onPress}
      >
        <Text
          style={[styles.itemText, this.props.smallText && styles.smallText]}
        >
          {this.props.t("surveyOption:" + this.props.id)}
        </Text>
        {this.props.selected && <Feather name="check" color="blue" size={20} />}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  item: {
    alignSelf: "stretch",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    padding: 10,
  },
  itemText: {
    fontSize: 17,
  },
  smallText: {
    fontSize: 14,
  },
});

const TranslatedListItem = withNamespaces()<ItemProps>(ListItem);
