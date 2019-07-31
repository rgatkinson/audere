import React from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { connect } from "react-redux";
import { logout, Action } from "../store";
import { WithNamespaces, withNamespaces } from "react-i18next";
import firebase from "react-native-firebase";
import Text from "./components/Text";
import {
  GUTTER,
  HEADER_TEXT_COLOR,
  MENU_ITEM_HEIGHT,
  MENU_ITEM_WIDTH,
  NAV_BAR_HEIGHT
} from "./styles";

interface Props {
  visible: boolean;
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
    //TBD
    this.props.onDismiss();
  };

  render() {
    const { t, visible } = this.props;
    const loggedIn = !!firebase.auth().currentUser;
    return (
      <Modal
        visible={visible}
        transparent={true}
        onRequestClose={this._onCancel}
      >
        {visible && (
          <View style={styles.menuContainer}>
            <TouchableWithoutFeedback onPress={this._onCancel}>
              <View style={styles.dismissContainer}></View>
            </TouchableWithoutFeedback>
            {loggedIn && (
              <View style={styles.menuItemContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={this._onLogout}
                >
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
    alignItems: "flex-end",
    paddingTop: NAV_BAR_HEIGHT
  },
  dismissContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  },
  menuItemContainer: {
    height: MENU_ITEM_HEIGHT,
    width: MENU_ITEM_WIDTH,
    padding: GUTTER / 2,
    borderWidth: 1,
    borderColor: HEADER_TEXT_COLOR,
    marginTop: -1,
    backgroundColor: "white"
  },
  menuItemText: {
    color: HEADER_TEXT_COLOR
  }
});
