import React from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Icon } from "react-native-elements";

interface Props {
  data: Map<string, boolean>;
  multiSelect: boolean;
  numColumns: number;
  onChange(data: Map<string, boolean>): void;
}

export default class OptionList extends React.Component<Props> {
  static emptyMap = (data: string[]) => {
    return new Map<string, boolean>(
      data.map((entry: string): [string, boolean] => [entry, false])
    );
  };

  _onPressItem = (id: string) => {
    // TODO support all of the above?
    const toggled = !this.props.data.get(id);
    const data = this.props.multiSelect
      ? new Map<string, boolean>(this.props.data)
      : OptionList.emptyMap(Array.from(this.props.data.keys()));

    data.set(id, toggled);
    this.props.onChange(data);
  };

  render() {
    const itemWidth =
      (Dimensions.get("window").width - 100 - this.props.numColumns * 20) /
      this.props.numColumns;
    const totalHeight =
      Math.ceil(this.props.data.size / this.props.numColumns) * 44;

    return (
      <View style={[{ height: totalHeight }, styles.container]}>
        <FlatList
          data={Array.from(this.props.data.entries())}
          numColumns={this.props.numColumns}
          scrollEnabled={false}
          keyExtractor={item => item[0]}
          renderItem={({ item }) => (
            <ListItem
              id={item[0]}
              selected={item[1]}
              width={itemWidth}
              onPressItem={this._onPressItem}
            />
          )}
        />
      </View>
    );
  }
}

interface ItemProps {
  id: string;
  selected: boolean;
  width: number;
  onPressItem(id: string): void;
}

class ListItem extends React.PureComponent<ItemProps> {
  _onPress = () => {
    this.props.onPressItem(this.props.id);
  };

  render() {
    return (
      <TouchableOpacity
        style={[styles.item, { width: this.props.width }]}
        onPress={this._onPress}
      >
        <Text style={styles.itemText}>{this.props.id}</Text>
        {this.props.selected && (
          <Icon name="check" color="blue" size={20} type="feather" />
        )}
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
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
});
