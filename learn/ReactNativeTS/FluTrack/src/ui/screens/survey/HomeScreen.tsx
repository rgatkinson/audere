import React from "react";
import { AppState, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { connect } from "react-redux";
import { Feather } from '@expo/vector-icons';
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { StoreState } from "../../../store";
import { completeFormIfExpired } from "../../../util/formTimeout";
import { COLLECTION_LOCATIONS } from "../../../resources/LocationConfig";

interface Props {
  admin: string;
  location: string;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  location: state.admin.location,
  admin: state.admin.administrator,
}))
class HomeScreen extends React.Component<Props & WithNamespaces> {
  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnMount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState: string) => {
    completeFormIfExpired(this.props.navigation);
  }

  _onStart = () => {
    const { t } = this.props;
    if (!this.props.location || !COLLECTION_LOCATIONS.hasOwnProperty(this.props.location)) {
      Alert.alert(
        t("studyLocationRequiredAlertTitle"),
        t("studyLocationRequiredAlertBody"),
        [
          {
            text: t("common:button:ok"),
            onPress: () => {},
          }
        ],
      );
    } else {
      this.props.navigation.push("Welcome");
    }
  };

  render() {
    const { t } = this.props;
    const clinician = !!this.props.admin ? this.props.admin : t("unknown");
    return (
      <View style={styles.container}>
        <Image
          style={{ height: 30, width: 380 }}
          source={require("../../../img/UWLogo.png")}
        />
        <Text style={styles.title}>{t("seattleFluStudy")}</Text>
        <TouchableOpacity style={styles.button} onPress={this._onStart}>
          <Text style={styles.buttonHeader}>{t("welcome")}</Text>
          <View style={styles.textContainer}>
            <Text style={styles.buttonText}>{t("learnMore")}</Text>
            <Feather
              name="chevron-right"
              color="#007AFF"
              size={32}
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.subtitle}>
          {t("clinician", { name: clinician })}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#EEEEEE",
    borderRadius: 13,
    height: 250,
    padding: 30,
    width: 534,
  },
  buttonHeader: {
    fontSize: 33,
    fontFamily: "OpenSans-Bold",
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  buttonText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    letterSpacing: -0.51,
    lineHeight: 26,
  },
  container: {
    alignItems: "center",
    backgroundColor: "#4B2E83",
    flex: 1,
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingTop: 40,
    justifyContent: "space-between",
  },
  subtitle: {
    color: "#FFFFFF",
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    paddingTop: 150,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "UniSansRegular",
    fontSize: 53,
    letterSpacing: 0.63,
    lineHeight: 62,
    paddingBottom: 61,
    paddingTop: 43,
  },
});

export default withNamespaces("homeScreen")<Props>(HomeScreen);
