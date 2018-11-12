/* This is similar to OptionTable but offers multiple select instead of single select
   TODO: Refactor OptionList, OptionTable, OptionTableMulti into one flexible class!
*/
import React from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon } from "react-native-elements";

interface Props {
  data: string[];
  numColumns: number;
  onChange(selected: Map<string, boolean>): void;
}

export default class OptionTableMulti extends React.Component<Props> {
  state = {
    selected: new Map<string, boolean>(),
  };

  _onPressItem = (id: string) => {
    const selected = new Map<string, boolean>(this.state.selected);
    selected.set(id, !selected.get(id));
    this.setState({ selected });
    this.props.onChange(selected);
  };

  render() {
    const itemWidth =
      (Dimensions.get("window").width - this.props.numColumns * 20) /
      this.props.numColumns;
    const totalHeight =
      Math.ceil(this.props.data.length / this.props.numColumns) * 42;

    return (
      <View style={[{ height: totalHeight }, styles.container]}>
        <FlatList
          data={this.props.data}
          extraData={this.state}
          numColumns={this.props.numColumns}
          scrollEnabled={false}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <ListItem
              id={item}
              selected={!!this.state.selected.get(item)}
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
        {this.props.selected ? (
          <Icon name="check" color="blue" size={20} type="feather" />
        ) : null}
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
    backgroundColor: "#fff",
  },
  itemText: {
    fontSize: 17,
  },
});
