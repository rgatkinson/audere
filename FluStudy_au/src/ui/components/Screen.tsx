// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { connect } from "react-redux";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { ScrollIntoView, wrapScrollView } from "react-native-scroll-into-view";
import { Action, Option, StoreState } from "../../store";
import Button from "./Button";
import Chrome from "./Chrome";
import Divider from "./Divider";
import MainImage from "./MainImage";
import Text from "./Text";
import Title from "./Title";
import ScreenImages from "./ScreenImages";
import { GUTTER, SMALL_TEXT } from "../styles";
import { setShownOfflineWarning } from "../../store";
import { SurveyQuestionData } from "../../resources/ScreenConfig";

interface Props {
  children?: any;
  desc?: string;
  dispatch?(action: Action): void;
  footer?: any;
  images?: string[];
  image?: string;
  isConnected?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  shownOfflineWarning?: boolean;
  skipButton?: boolean;
  subTitle?: string;
  title?: string;
  onNext?: () => void;
}

const CustomScrollView = wrapScrollView(ScrollView);

@connect((state: StoreState) => ({
  isConnected: state.meta.isConnected,
  shownOfflineWarning: state.meta.shownOfflineWarning,
}))
class Screen extends React.Component<Props & WithNamespaces> {
  _handleNavigation = () => {
    const {
      dispatch,
      isConnected,
      onNext,
      shownOfflineWarning,
      t,
    } = this.props;

    if (!isConnected && !shownOfflineWarning) {
      dispatch!(setShownOfflineWarning(true));
      Alert.alert(
        t("common:notifications:connectionErrorTitle"),
        t("common:notifications:connectionError"),
        [{ text: "Try Again" }]
      );
    } else {
      !!onNext && onNext();
    }
  };

  render() {
    const {
      desc,
      children,
      footer,
      images,
      image,
      menuItem,
      navigation,
      skipButton,
      subTitle,
      t,
      title,
    } = this.props;
    return (
      <Chrome menuItem={menuItem} navigation={navigation}>
        <View style={styles.scrollContainer}>
          <CustomScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContainer}>
              {!!image && <MainImage menuItem={menuItem} uri={image} />}
              {!!subTitle && (
                <View style={{ paddingHorizontal: GUTTER * 2 }}>
                  <Divider style={{ marginVertical: GUTTER / 2 }} />
                  <Text style={{ alignSelf: "center" }} content={subTitle} />
                  <Divider style={{ marginVertical: GUTTER / 2 }} />
                </View>
              )}
              {!!title && <Title label={title} />}
              {!!desc && (
                <Text
                  content={desc}
                  style={{
                    alignSelf: "stretch",
                    marginBottom: GUTTER,
                  }}
                />
              )}
              {!!images && <ScreenImages images={images} />}
              {children}
            </View>
            <View style={styles.footerContainer}>
              {!skipButton && (
                <Button
                  enabled={true}
                  label={t("common:button:continue")}
                  primary={true}
                  onPress={this._handleNavigation}
                />
              )}
              {footer}
            </View>
          </CustomScrollView>
        </View>
      </Chrome>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: GUTTER / 2,
  },
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: GUTTER,
  },
  innerContainer: {
    marginHorizontal: GUTTER,
    flex: 1,
  },
  scrollContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
});

export default withNamespaces()(Screen);
