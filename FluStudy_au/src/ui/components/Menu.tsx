// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text as SystemText,
  TouchableOpacity,
} from "react-native";
import {
  DrawerItems,
  NavigationScreenProp,
  SafeAreaView,
} from "react-navigation";
import { Feather } from "@expo/vector-icons";
import Divider from "./../components/Divider";
import i18n from "i18next";
import {
  GUTTER,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  SYSTEM_FONT,
  SYSTEM_TEXT,
} from "./../styles";

export const Menu = (props: any) => {
  const aboutItems = { ...props, items: props.items.slice(1, 4) };
  const helpItems = { ...props, items: props.items.slice(4) };
  return (
    <ScrollView>
      <SafeAreaView
        style={styles.container}
        forceInset={{ top: "always", horizontal: "never" }}
      >
        <TouchableOpacity
          style={styles.icon}
          onPress={() => {
            props.navigation.closeDrawer();
            if (props.activeItemKey !== "Home") {
              props.navigation.navigate("Home");
            }
          }}
        >
          <Feather color={PRIMARY_COLOR} name="x" size={30} />
        </TouchableOpacity>
        <SystemText style={styles.header}>
          {i18n.t("menu:aboutFluAtHome")}
        </SystemText>
        <Divider style={styles.divider} />
        <DrawerItems
          activeTintColor={SECONDARY_COLOR}
          inactiveTintColor={SECONDARY_COLOR}
          {...aboutItems}
        />
        <SystemText style={styles.header}>
          {i18n.t("menu:helpAndSupport")}
        </SystemText>
        <Divider style={styles.divider} />
        <DrawerItems
          activeTintColor={SECONDARY_COLOR}
          inactiveTintColor={SECONDARY_COLOR}
          {...helpItems}
        />
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: GUTTER,
  },
  divider: {
    marginTop: GUTTER / 2,
    marginRight: GUTTER,
  },
  header: {
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    marginTop: GUTTER,
  },
  icon: {
    alignSelf: "flex-end",
    justifyContent: "center",
  },
});
