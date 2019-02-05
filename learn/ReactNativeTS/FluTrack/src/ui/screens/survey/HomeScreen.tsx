import React from "react";
import {
  AppState,
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text as SystemText,
  TouchableOpacity,
  View,
} from "react-native";
import { connect } from "react-redux";
import { Feather } from "@expo/vector-icons";
import { NavigationScreenProp } from "react-navigation";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { StoreState } from "../../../store";
import { completeFormIfExpired } from "../../../util/formTimeout";
import { COLLECTION_LOCATIONS } from "../../../resources/LocationConfig";
import LanguageModal, { languages } from "../../components/LanguageModal";
import Text from "../../components/Text";

interface Props {
  admin: string;
  location: string;
  navigation: NavigationScreenProp<any, any>;
  isDemo: boolean;
}

interface State {
  language: string;
  languageOpen: boolean;
}

@connect((state: StoreState) => ({
  location: state.admin.location,
  admin: state.admin.administrator,
  isDemo: state.admin.isDemo,
}))
class HomeScreen extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      language: "en",
      languageOpen: false,
    };
  }

  componentDidMount() {
    AppState.addEventListener("change", this._handleAppStateChange);
  }

  componentWillUnMount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState: string) => {
    completeFormIfExpired(this.props.navigation);
  };

  _onStart = () => {
    const { t } = this.props;
    if (
      !this.props.location ||
      !COLLECTION_LOCATIONS.hasOwnProperty(this.props.location)
    ) {
      Alert.alert(
        t("studyLocationRequiredAlertTitle"),
        t("studyLocationRequiredAlertBody"),
        [
          {
            text: t("common:button:ok"),
            onPress: () => {},
          },
        ]
      );
    } else {
      this.props.navigation.push("Welcome");
    }
  };

  render() {
    const { t, i18n } = this.props;
    const clinician = !!this.props.admin ? this.props.admin : t("unknown");
    return (
      <View style={styles.container}>
        <View style={styles.languageSwitcher}>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => this.setState({ languageOpen: true })}
          >
            <View style={{ flexDirection: "row" }}>
              <Text content={t("currentLang")} style={styles.languageText} />
              <SystemText style={styles.pickerText}>
                {languages[this.state.language]}
              </SystemText>
            </View>
            <Feather
              style={styles.languageIcon}
              name="chevron-down"
              color="black"
              size={16}
            />
          </TouchableOpacity>
          <LanguageModal
            language={this.state.language}
            visible={this.state.languageOpen}
            onDismiss={(language: string) => {
              i18n.changeLanguage(language);
              this.setState({ languageOpen: false, language });
            }}
          />
        </View>
        <StatusBar barStyle="light-content" />
        <Image
          style={{ height: 30, width: 380 }}
          source={require("../../../img/UWLogo.png")}
        />
        <SystemText style={styles.title}>{t("seattleFluStudy")}</SystemText>
        <TouchableOpacity style={styles.button} onPress={this._onStart}>
          <SystemText style={styles.buttonHeader}>{t("welcome")}</SystemText>
          <View style={styles.textContainer}>
            <SystemText style={styles.buttonText}>{t("learnMore")}</SystemText>
            <Feather name="chevron-right" color="#007AFF" size={32} />
          </View>
        </TouchableOpacity>
        <SystemText style={styles.subtitleGap} />
        <SystemText style={styles.subtitle}>
          {t("clinician", { name: clinician })}
        </SystemText>
        {this.props.isDemo && (
          <SystemText style={styles.subtitle}>
            {"DEMO MODE - data not used in study"}
          </SystemText>
        )}
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
  },
  languageSwitcher: {
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 70,
    height: 120,
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingTop: 40,
    justifyContent: "space-between",
  },
  subtitleGap: {
    color: "#FFFFFF",
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    paddingTop: 110,
  },
  subtitle: {
    color: "#FFFFFF",
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    paddingTop: 20,
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
  picker: {
    backgroundColor: "white",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 10,
    width: 534,
  },
  languageIcon: {
    margin: 10,
  },
  languageText: {
    fontFamily: "OpenSans-Bold",
    fontSize: 17,
    marginVertical: 5,
  },
  pickerText: {
    fontSize: 17,
    marginVertical: 5,
    marginLeft: 10,
    paddingTop: 2,
  },
});

export default withNamespaces("homeScreen")<Props>(HomeScreen);
