// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import {
  Animated,
  Dimensions,
  findNodeHandle,
  GestureResponderEvent,
  Image,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { toggleDemoMode, Action, StoreState } from "../store";
import MultiTapContainer from "./components/MultiTapContainer";
import Text from "./components/Text";
import {
  ADD_NEW_IMAGE,
  APP_MENU_IMAGE,
  BACK_ARROW_IMAGE,
  BORDER_COLOR,
  DATA_UPLOADING_IMAGE,
  DEMO_MODE_COLOR,
  GUTTER,
  LIGHT_COLOR,
  LOGO_WIDTH,
  LOGO_HEIGHT,
  NAV_BAR_HEIGHT,
  SEARCH_IMAGE,
  STATUS_BAR_HEIGHT,
  TITLE_IMAGE,
  TITLEBAR_COLOR,
} from "./styles";
import AppMenu from "./AppMenu";
import { hasPendingPhotos } from "./../transport/photoUploader";
import Title from "./components/Title";

// Row width: screen gutter * 2 plus icon gutter
const rowWidth = Dimensions.get("window").width - 2 * GUTTER;

interface Props {
  demoMode: boolean;
  dispatch(action: Action): void;
  animScrollY?: Animated.Value;
  showLogo?: boolean;
  showAppMenuButton?: boolean;
  showBottomBorder?: boolean;
  onBack?(event: GestureResponderEvent): void;
  titlebarText?: string;
  hasPendingPhoto: boolean;
  onSearchTextChanged?(searchText: string): void;
  onNew?(event: GestureResponderEvent): void;
}

interface State {
  showAppMenu: boolean;
  appMenuOffsetX: number;
  appMenuOffsetY: number;
  animLeft: Animated.Value;
  animOpacity: Animated.Value;
}

class TitleBar extends React.Component<Props & WithNamespaces, State> {
  _appMenuIcon: any;
  _searchInput: any;

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      showAppMenu: false,
      appMenuOffsetX: 0,
      appMenuOffsetY: 0,
      animLeft: new Animated.Value(rowWidth),
      animOpacity: new Animated.Value(0),
    };
    this._appMenuIcon = React.createRef<Image>();
    this._searchInput = React.createRef<TextInput>();
  }

  _toggleDemoMode = () => {
    this.props.dispatch(toggleDemoMode());
  };

  _handleMenuPress = () => {
    const appMenuIcon =
      this._appMenuIcon.current && findNodeHandle(this._appMenuIcon.current);
    appMenuIcon &&
      UIManager.measureInWindow(appMenuIcon, (x, y, w, h) => {
        this.setState({
          showAppMenu: !this.state.showAppMenu,
          appMenuOffsetY: y + h + GUTTER / 2,
        });
      });
  };

  _handleMenuDismiss = () => {
    this.setState({ showAppMenu: false });
  };

  _onSearch = () => {
    this._searchInput.current!.focus();
  };

  _expandSearch = () => {
    Animated.parallel([
      Animated.timing(this.state.animLeft, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(this.state.animOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  _collapseSearch = () => {
    Animated.parallel([
      Animated.timing(this.state.animLeft, {
        toValue: rowWidth,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(this.state.animOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  _onSearchTextChanged = (searchText: string) => {
    this.props.onSearchTextChanged &&
      this.props.onSearchTextChanged(searchText);
  };

  _onSearchCancel = () => {
    this._searchInput.current!.clear();
    this._onSearchTextChanged("");
  };

  render() {
    const {
      animScrollY,
      demoMode,
      hasPendingPhoto,
      onBack,
      onSearchTextChanged,
      onNew,
      showAppMenuButton,
      showBottomBorder,
      showLogo,
      t,
      titlebarText,
    } = this.props;
    const { animLeft, animOpacity } = this.state;
    const showTextPortion =
      showAppMenuButton ||
      onBack ||
      (titlebarText && titlebarText.length > 0) ||
      onSearchTextChanged ||
      onNew;
    let opacityY;
    if (animScrollY) {
      opacityY = animScrollY.interpolate({
        inputRange: [0, 20],
        outputRange: [1, 0],
        extrapolate: "clamp",
      });
    }
    return (
      <Fragment>
        <View
          style={[
            styles.backgroundContainer,
            showBottomBorder && styles.backgroundBorder,
          ]}
        >
          <StatusBar
            backgroundColor="transparent"
            barStyle="dark-content"
            translucent={true}
          />
          <MultiTapContainer
            active={true}
            taps={4}
            onMultiTap={this._toggleDemoMode}
          >
            {demoMode && <View style={styles.demoView} />}
            <View style={styles.contentContainer}>
              {showLogo && (
                <Animated.Image
                  source={TITLE_IMAGE}
                  style={[styles.titleImage, { opacity: opacityY }]}
                />
              )}
              {showTextPortion && (
                <View style={styles.titleTextContainer}>
                  {showAppMenuButton ? (
                    <TouchableOpacity
                      style={styles.leftContainer}
                      onPress={this._handleMenuPress}
                    >
                      <Image
                        ref={this._appMenuIcon}
                        source={APP_MENU_IMAGE}
                        style={styles.appMenuIcon}
                      />
                    </TouchableOpacity>
                  ) : onBack ? (
                    <TouchableOpacity
                      style={styles.leftContainer}
                      onPress={onBack}
                    >
                      <Image
                        source={BACK_ARROW_IMAGE}
                        style={styles.backIcon}
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.leftContainer} />
                  )}
                  {titlebarText && titlebarText.length > 0 ? (
                    <Title label={titlebarText} style={styles.titlebarText} />
                  ) : (
                    <View style={styles.titlebarText} />
                  )}
                  <View style={styles.pendingIconContainer}>
                    {!!hasPendingPhoto && (
                      <Image
                        style={styles.pendingIcon}
                        source={DATA_UPLOADING_IMAGE}
                      />
                    )}
                  </View>
                  {onSearchTextChanged && (
                    <TouchableOpacity
                      style={styles.iconContainer}
                      onPress={this._onSearch}
                    >
                      <Image source={SEARCH_IMAGE} style={styles.actionIcon} />
                    </TouchableOpacity>
                  )}
                  {onNew && (
                    <TouchableOpacity
                      style={styles.iconContainer}
                      onPress={onNew}
                    >
                      <Image source={ADD_NEW_IMAGE} style={styles.actionIcon} />
                    </TouchableOpacity>
                  )}
                  {onSearchTextChanged && (
                    <Animated.View
                      style={[
                        styles.searchContainer,
                        {
                          transform: [
                            { translateX: animLeft },
                            { translateY: GUTTER / 4 },
                          ],
                          opacity: animOpacity,
                        },
                      ]}
                    >
                      <View style={styles.searchFieldContainer}>
                        <Image
                          source={SEARCH_IMAGE}
                          style={styles.actionIcon}
                        />
                        <TextInput
                          autoCapitalize="words"
                          ref={this._searchInput}
                          style={{
                            fontSize: 18,
                            paddingVertical: GUTTER / 4,
                          }}
                          onFocus={this._expandSearch}
                          onChangeText={this._onSearchTextChanged}
                          onBlur={this._collapseSearch}
                          placeholder={t("search")}
                          returnKeyType="search"
                        />
                      </View>
                      <TouchableOpacity onPress={this._onSearchCancel}>
                        <Text
                          bold={true}
                          content=" CANCEL"
                          numberOfLines={1}
                          ellipsizeMode="clip"
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              )}
            </View>
          </MultiTapContainer>
        </View>
        <AppMenu
          visible={this.state.showAppMenu}
          offsetX={this.state.appMenuOffsetX}
          offsetY={this.state.appMenuOffsetY}
          onDismiss={this._handleMenuDismiss}
        />
      </Fragment>
    );
  }
}

export default connect((state: StoreState) => ({
  demoMode: state.meta.demoMode,
  hasPendingPhoto: hasPendingPhotos(state),
}))(withNamespaces("titleBar")(TitleBar));

const styles = StyleSheet.create({
  backgroundContainer: {
    alignSelf: "stretch",
    backgroundColor: TITLEBAR_COLOR,
    width: "100%",
  },
  backgroundBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_COLOR,
  },
  demoView: {
    backgroundColor: DEMO_MODE_COLOR,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: NAV_BAR_HEIGHT + STATUS_BAR_HEIGHT,
  },
  contentContainer: {
    paddingTop: STATUS_BAR_HEIGHT,
    flexDirection: "column",
  },
  titleImage: {
    alignSelf: "center",
    aspectRatio: LOGO_WIDTH / LOGO_HEIGHT,
    marginTop: GUTTER / 2,
    width: 140,
  },
  titleTextContainer: {
    marginHorizontal: GUTTER,
    marginVertical: GUTTER,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  leftContainer: {
    width: 35,
    marginBottom: GUTTER / 4,
  },
  appMenuIcon: {
    width: 22,
    height: 20,
  },
  backIcon: {
    width: 25,
    height: 20,
  },
  titlebarText: {
    flex: 1,
    marginHorizontal: GUTTER / 2,
  },
  pendingIconContainer: {
    marginBottom: GUTTER / 4,
    width: 29,
  },
  pendingIcon: { height: 18, width: 29 },
  iconContainer: {
    marginBottom: GUTTER / 4,
  },
  searchContainer: {
    position: "absolute",
    backgroundColor: TITLEBAR_COLOR,
    flexDirection: "row",
    overflow: "hidden",
    width: "100%",
    alignItems: "center",
  },
  searchFieldContainer: {
    backgroundColor: "white",
    flexDirection: "row",
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER_COLOR,
    borderRadius: 3,
    alignItems: "center",
  },
  actionIcon: {
    width: 20,
    height: 20,
    marginLeft: GUTTER / 2,
  },
});
