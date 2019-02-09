import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";
import BorderView from "./BorderView";
import Text from "./Text";

export interface GridItem {
  imageSrc: ImageSourcePropType;
  label: string;
}

interface Props {
  columns: number;
  items: GridItem[];
}

// TODO: accept and utilize aspect ratio: calculate width via screen width and update height accordingly
//TODO refactor this;
const SCREEN_MARGIN = 15;
export default class ImageGrid extends React.Component<Props> {
  render() {
    let index = 0;
    let i = 0;
    const rows = [];

    while (index < this.props.items.length) {
      const row = [];
      const itemWidth =
        (Dimensions.get("window").width -
          SCREEN_MARGIN * (this.props.columns + 1)) /
        this.props.columns;
      const imageWidth = itemWidth - SCREEN_MARGIN * 2;
      for (i = index; i < index + this.props.columns; i++) {
        row.push(
          <View
            key={this.props.items[i].label + i}
            style={[
              styles.item,
              i < index + this.props.columns - 1 && styles.itemMargin,
            ]}
          >
            <BorderView>
              <Image
                style={{ height: imageWidth, width: imageWidth }}
                source={this.props.items[i].imageSrc}
              />
            </BorderView>
            <Text
              bold={true}
              center={true}
              content={this.props.items[i].label}
            />
          </View>
        );
      }
      rows.push(
        <View key={"row" + i} style={styles.row}>
          {row}
        </View>
      );
      index = index + this.props.columns;
    }

    return <View style={styles.grid}>{rows}</View>;
  }
}

const styles = StyleSheet.create({
  grid: {
    alignSelf: "stretch",
  },
  item: {
    flex: 1,
    marginBottom: 15,
  },
  itemMargin: {
    marginRight: 15,
  },
  row: {
    alignSelf: "stretch",
    flexDirection: "row",
  },
});
