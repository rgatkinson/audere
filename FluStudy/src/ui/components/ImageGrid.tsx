import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";
import BorderView from "./BorderView";
import Grid from "./Grid";
import Text from "./Text";
import { GUTTER } from "../styles";

export interface GridItem {
  imageSrc: ImageSourcePropType;
  label: string;
}

interface Props {
  columns: number;
  items: GridItem[];
}

export default class ImageGrid extends React.Component<Props> {
  render() {
    return (
      <Grid
        rowStyle={{ alignItems: "flex-start" }}
        columns={this.props.columns}
        items={this.props.items}
        keyExtractor={item => item.label}
        renderItem={(item, width) => {
          return (
            <View style={{ marginBottom: GUTTER }}>
              <BorderView>
                <Image
                  style={{ height: width - GUTTER, width: width - GUTTER }}
                  source={item.imageSrc}
                />
              </BorderView>
              <Text bold={true} center={true} content={item.label} />
            </View>
          );
        }}
      />
    );
  }
}
