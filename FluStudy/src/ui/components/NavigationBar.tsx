import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";

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
          <Feather
            color="#007AFF"
            name="chevron-left"
            size={30}
            style={{ paddingTop: 5 }}
          />
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
            color={this.props.canProceed ? "#007AFF" : "gray"}
            name="chevron-right"
            size={30}
            style={{ paddingTop: 5 }}
          />
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionContainer: {
    flexDirection: "row",
  },
  actionText: {
    fontFamily: "System",
    fontSize: 17,
    color: "#007AFF",
  },
  container: {
    backgroundColor: "#EEEEEE",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 60,
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  inactiveText: {
    color: "gray",
  },
  title: {
    fontFamily: "System",
    fontSize: 17,
    fontWeight: "bold",
  },
});

export default withNamespaces("navigationBar")<Props>(NavigationBar);
