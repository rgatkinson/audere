import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";

interface Props {
  canProceed: boolean;
  progressNumber?: string;
  progressLabel?: string;
  title: string;
  onBack: any;
  onForward: any;
}

export default class StatusBar extends React.Component<Props> {
  _back = () => {
    this.props.onBack();
  };

  _forward = () => {
    this.props.onForward();
  };

  render() {
    return (
      <View style={styles.statusBar}>
        <View>
          <Text style={[styles.progressText, styles.progressNumber]}>
            {this.props.progressNumber}
          </Text>
          <Text style={styles.progressText}>{this.props.progressLabel}</Text>
        </View>
        <Text style={styles.statusBarTitle}>{this.props.title}</Text>
        <View style={styles.nav}>
          <TouchableOpacity onPress={this._back}>
            <Icon
              color="blue"
              containerStyle={[styles.icon, styles.iconLeft]}
              name="chevron-up"
              size={40}
              type="feather"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this._forward}
            disabled={!this.props.canProceed}
          >
            <Icon
              color={this.props.canProceed ? "blue" : "gray"}
              containerStyle={styles.icon}
              name="chevron-down"
              size={40}
              type="feather"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  icon: {
    padding: 5,
  },
  iconLeft: {
    borderColor: "blue",
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  nav: {
    alignItems: "center",
    borderColor: "blue",
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "center",
  },
  progressText: {
    color: "#444444",
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  progressNumber: {
    fontFamily: "OpenSans-SemiBold",
  },
  statusBar: {
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    flexDirection: "row",
    height: 90,
    justifyContent: "space-between",
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 2,
    shadowOpacity: 0.5,
  },
  statusBarTitle: {
    color: "#444444",
    fontFamily: "OpenSans-Regular",
    fontSize: 20,
    letterSpacing: -0.41,
    lineHeight: 22,
    textAlign: "center",
  },
});
