import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import {
  GUTTER,
  NAV_BAR_HEIGHT,
  STATUS_BAR_HEIGHT,
  SYSTEM_FONT,
  SYSTEM_TEXT,
} from "../styles";

interface Props {
  demoMode?: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  onBack?: () => any;
}

class NavigationBar extends React.Component<Props & WithNamespaces> {
  _goHome = () => {
    this.props.navigation.navigate("Home");
  };

  _onBack = () => {
    if (this.props.onBack != null) {
      this.props.onBack();
    } else {
      this.props.navigation.pop();
    }
  };

  _onMenu = () => {
    this.props.navigation.toggleDrawer();
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        {!!this.props.hideBackButton ? (
          <View style={{ width: 30 }} />
        ) : !!this.props.menuItem ? (
          <TouchableOpacity
            style={styles.actionContainer}
            onPress={this._goHome}
          >
            <Feather color="white" name="x" size={30} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionContainer}
            onPress={this._onBack}
          >
            <Feather color="white" name="arrow-left" size={30} />
          </TouchableOpacity>
        )}
        <Text
          style={styles.title}
          center={true}
          content={this.props.menuItem || this.props.demoMode ? "" : "flu@home"}
        />
        <TouchableOpacity style={styles.actionContainer} onPress={this._onMenu}>
          <Feather color="white" name={"menu"} size={30} />
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  container: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
    justifyContent: "space-between",
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: GUTTER / 2,
  },
  title: {
    alignSelf: "center",
    color: "white",
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    fontWeight: "bold",
  },
});

export default withNamespaces("navigationBar")(NavigationBar);
