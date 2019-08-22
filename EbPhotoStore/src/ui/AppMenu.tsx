import React from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { connect } from "react-redux";
import { logout, Action } from "../store";
import { DEVICE_INFO } from "../store/FirebaseStore";
import { WithNamespaces, withNamespaces } from "react-i18next";
import firebase from "react-native-firebase";
import Text from "./components/Text";
import {
  GUTTER,
  MENU_ITEM_HEIGHT,
  MENU_ITEM_WIDTH,
  TEXT_COLOR,
} from "./styles";

interface Props {
  visible: boolean;
  offsetX: number;
  offsetY: number;
  onDismiss(): void;
  dispatch(action: Action): void;
}

class AppMenu extends React.Component<Props & WithNamespaces> {
  _onCancel = () => {
    this.props.onDismiss();
  };

  _onLogout = () => {
    firebase.auth().signOut();
    this.props.dispatch(logout());
    this.props.onDismiss();
  };

  _onAbout = () => {
    const { t } = this.props;
    Alert.alert(
      t("buildInfo:title"),
      t("buildInfo:version") +
        DEVICE_INFO.clientVersion.version +
        t("buildInfo:build") +
        DEVICE_INFO.clientBuild +
        t("buildInfo:commit") +
        DEVICE_INFO.clientVersion.hash +
        t("buildInfo:date") +
        DEVICE_INFO.clientVersion.buildDate +
        t("buildInfo:device") +
        Platform.OS +
        " " +
        Platform.Version +
        t("buildInfo:installation") +
        DEVICE_INFO.installation +
        t("buildInfo:apiServer") +
        firebase.app().options.databaseURL
    );

    this.props.onDismiss();
  };

  render() {
    const { offsetX, offsetY, t, visible } = this.props;
    const loggedIn = !!firebase.auth().currentUser;
    return (
      <Modal
        visible={visible}
        transparent={true}
        onRequestClose={this._onCancel}
      >
        {visible && (
          <View
            style={[
              styles.menuContainer,
              { paddingLeft: offsetX, paddingTop: offsetY },
            ]}
          >
            <TouchableWithoutFeedback onPress={this._onCancel}>
              <View style={styles.dismissContainer}></View>
            </TouchableWithoutFeedback>
            {loggedIn && (
              <View style={styles.menuItemContainer}>
                <TouchableOpacity onPress={this._onLogout}>
                  <Text style={styles.menuItemText} content={t("logout")} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.menuItemContainer}>
              <TouchableOpacity onPress={this._onAbout}>
                <Text style={styles.menuItemText} content={t("about")} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    );
  }
}

export default connect()(withNamespaces("appMenu")(AppMenu));

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  dismissContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  menuItemContainer: {
    height: MENU_ITEM_HEIGHT,
    width: MENU_ITEM_WIDTH,
    padding: GUTTER / 2,
    borderWidth: 1,
    borderColor: TEXT_COLOR,
    marginTop: -1,
    backgroundColor: "white",
  },
  menuItemText: {
    color: TEXT_COLOR,
  },
});
