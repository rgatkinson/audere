import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { Feather } from "@expo/vector-icons";
import Divider from "./components/Divider";
import Screen from "./components/Screen";
import {
  GUTTER,
  LINK_COLOR,
  STATUS_BAR_HEIGHT,
  SYSTEM_FONT,
  SYSTEM_TEXT,
} from "./styles";
import { timestampRender, timestampInteraction } from "./screens/analytics";

export const Menu = ({ navigation }: NavigationScreenProps) => (
  <View style={{ marginTop: STATUS_BAR_HEIGHT, padding: GUTTER }}>
    <TouchableOpacity
      style={{ alignSelf: "flex-end", justifyContent: "center" }}
      onPress={navigation.closeDrawer}
    >
      <Feather color={LINK_COLOR} name="x" size={30} />
    </TouchableOpacity>
    <Text style={styles.header}>ABOUT FLU@HOME</Text>
    <Divider style={styles.divider} />
    <TouchableOpacity
      onPress={() => {
        navigation.closeDrawer();
        navigation.navigate("About");
      }}
    >
      <Text style={styles.menuItem}>About the study</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation.navigate("Partners")}>
      <Text style={styles.menuItem}>Partners</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation.navigate("About")}>
      <Text style={styles.menuItem}>View Consent</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation.navigate("About")}>
      <Text style={styles.menuItem}>App Version</Text>
    </TouchableOpacity>
    <Text style={styles.header}>HELP & SUPPORT</Text>
    <Divider style={styles.divider} />
  </View>
);

const styles = StyleSheet.create({
  divider: {
    marginTop: GUTTER / 2,
    marginRight: GUTTER,
  },
  header: {
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    marginTop: GUTTER,
  },
  menuItem: {
    fontFamily: SYSTEM_FONT,
    fontSize: SYSTEM_TEXT,
    fontWeight: "bold",
    marginVertical: GUTTER / 2,
  },
});
