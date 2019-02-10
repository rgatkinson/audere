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
  navigation: NavigationScreenProp<any, any>;
  canProceed: boolean;
  onNext(): void;
}

class NavigationBar extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.actionContainer}
          onPress={() => {
            this.props.navigation.pop();
          }}
        >
          <Feather color={LINK_COLOR} name="chevron-left" size={30} />
          <Text style={styles.actionText} content={t("back")} />
        </TouchableOpacity>
        <Text style={styles.title} center={true} content="FLU@HOME" />
        <TouchableOpacity
          style={styles.actionContainer}
          onPress={this.props.onNext}
          disabled={!this.props.canProceed}
        >
          <Text
            style={[
              styles.actionText,
              !this.props.canProceed && styles.inactiveText,
            ]}
            content={t("next")}
          />
          <Feather
            color={this.props.canProceed ? LINK_COLOR : DISABLED_COLOR}
            name="chevron-right"
            size={30}
          />
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
  actionText: {
    alignSelf: "center",
    color: LINK_COLOR,
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
  },
  container: {
    alignItems: "center",
    backgroundColor: STATUS_BAR_COLOR,
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: NAV_BAR_HEIGHT,
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
