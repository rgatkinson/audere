import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import {
  BORDER_COLOR,
  DISABLED_COLOR,
  GUTTER,
  LINK_COLOR,
  NAV_BAR_HEIGHT,
  STATUS_BAR_COLOR,
  STATUS_BAR_HEIGHT,
  SYSTEM_FONT,
  SYSTEM_TEXT,
} from "../styles";

interface Props {
  canProceed: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
}

class NavigationBar extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        {!!this.props.hideBackButton ? (
          <View style={{ width: 30 }} />
        ) : !!this.props.menuItem ? (
          <TouchableOpacity
            style={styles.actionContainer}
            onPress={() => this.props.navigation.navigate("Home")}
          >
            <Feather color={LINK_COLOR} name="x" size={30} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionContainer}
            onPress={() => this.props.navigation.pop()}
          >
            <Feather color={LINK_COLOR} name="arrow-left" size={30} />
          </TouchableOpacity>
        )}
        <Text style={styles.title} center={true} content="FLU@HOME" />
        <TouchableOpacity
          style={styles.actionContainer}
          onPress={() => this.props.navigation.openDrawer()}
        >
          <Feather color={LINK_COLOR} name={"menu"} size={30} />
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
    backgroundColor: STATUS_BAR_COLOR,
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
    justifyContent: "space-between",
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: GUTTER / 2,
  },
  inactiveText: {
    color: DISABLED_COLOR,
  },
  title: {
    alignSelf: "center",
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    fontWeight: "bold",
  },
});

export default withNamespaces("navigationBar")<Props>(NavigationBar);
