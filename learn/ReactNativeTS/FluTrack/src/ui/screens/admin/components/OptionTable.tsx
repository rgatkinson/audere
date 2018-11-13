/* Differences from OptionList: 
   - single-select model where "selected" just returns string value of item
   TODO: Refactor OptionList and OptionTable into one component?
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
  selected: string;
  onChange(selected: string): void;
}

export default class OptionTable extends React.Component<Props> {
  state = {
    selected: this.props.selected,
  };

  _onPressItem = (id: string) => {
    this.setState({ selected: id });
    this.props.onChange(id);
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
              selected={this.state.selected === item}
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
