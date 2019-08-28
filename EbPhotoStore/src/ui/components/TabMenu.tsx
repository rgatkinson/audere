import React from "react";
import { Image, StyleSheet, View, TouchableOpacity } from "react-native";
import Text from "./Text";
import {
  GUTTER,
  HIGHLIGHT_COLOR_DARK,
  TITLEBAR_COLOR,
  ICON_SIZE,
  HIGHLIGHT_BORDER_BOTTOM_WIDTH,
} from "../styles";

interface TabButtonProps {
  index: number;
  config: TabConfig;
  onPress(index: number): void;
  highlight: boolean;
}

const TabButton = (props: TabButtonProps) => {
  function _pressed() {
    props.onPress(props.index);
  }

  return (
    <View
      key={`tab-${props.config.label}`}
      style={[styles.tabContainer, props.highlight && styles.highlight]}
    >
      <TouchableOpacity style={styles.tabLabel} onPress={_pressed}>
        {!!props.config.iconUri && (
          <Image
            style={styles.icon}
            source={{
              uri: props.config.iconUri + (props.highlight ? "on" : "off"),
            }}
          />
        )}
        <Text
          style={[props.highlight && styles.highlightText]}
          center={true}
          content={props.config.label}
        />
      </TouchableOpacity>
    </View>
  );
};

interface TabConfig {
  label: string;
  iconUri?: string;
}

interface Props {
  tabs: TabConfig[];
  selectedIndex: number;
  onSelect(selectedIndex: number): void;
}

class TabMenu extends React.Component<Props> {
  _onTabPressed = (index: number) => {
    this.props.onSelect(index);
  };

  render() {
    const { selectedIndex } = this.props;

    return (
      <View style={styles.container}>
        <View style={styles.tabRow}>
          {this.props.tabs.map((tab, index) => {
            return (
              <TabButton
                key={`tab-${index}`}
                config={tab}
                highlight={index == selectedIndex}
                index={index}
                onPress={this._onTabPressed}
              />
            );
          })}
        </View>
        {this.props.children &&
          (this.props.children as any).length > selectedIndex &&
          (this.props.children as any)[selectedIndex]}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    flex: 1,
  },
  highlight: {
    borderBottomWidth: HIGHLIGHT_BORDER_BOTTOM_WIDTH,
    borderBottomColor: HIGHLIGHT_COLOR_DARK,
  },
  highlightText: {
    color: HIGHLIGHT_COLOR_DARK,
  },
  icon: {
    height: ICON_SIZE,
    marginRight: GUTTER / 2,
    resizeMode: "contain",
    width: ICON_SIZE,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: TITLEBAR_COLOR,
  },
  tabContainer: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    borderBottomColor: "darkgrey",
    borderBottomWidth: 2,
  },
  tabLabel: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: GUTTER,
  },
});

export default TabMenu;
