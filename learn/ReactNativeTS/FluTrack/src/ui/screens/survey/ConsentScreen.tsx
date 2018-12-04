import React from "react";
import {
  Alert,
  ImageEditor,
  ImageStore,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  Action,
  StoreState,
  setName,
  setSignaturePng,
  setConsentTerms,
} from "../../../store";
import { NavigationScreenProp } from "react-navigation";
import { format, addMinutes } from "date-fns";
import * as ExpoPixi from "expo-pixi";
import { EnrolledConfig } from "./EnrolledScreen";
import Button from "../../components/Button";
import Description from "../../components/Description";
import StatusBar from "../../components/StatusBar";
import TextInput from "../../components/TextInput";
import Title from "../../components/Title";

interface Props {
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  name: string;
  locationType: string;
}
interface SnapshotImage {
  height: number;
  width: number;
  uri: string;
}

// @ts-ignore
const remoteDebugging = typeof DedicatedWorkerGlobalScope !== "undefined";

const ConsentConfig = {
  id: "Consent",
  title: "consent",
  description: {
    label: "thankYouAssisting",
  },
  buttons: [
    { key: "clearSignature", primary: false },
    { key: "submit", primary: true },
  ],
};

@connect((state: StoreState) => ({
  name: state.form!.name,
  locationType: state.admin!.locationType,
}))
class ConsentScreen extends React.Component<Props & WithNamespaces> {
  state = {
    image: null,
  };

  sketch: any;

  _onClear = () => {
    this.sketch.clear();
    this.setState({ image: null });
  };

  _onSubmit = () => {
    if (!this.state.image && !remoteDebugging) {
      Alert.alert(this.props.t("pleaseSign"));
      return;
    } else if (!!this.state.image) {
      this.props.dispatch(setConsentTerms(this.props.t("consentFormText")));
      this.saveBase64Async(this.state.image!);
    }
    this.props.navigation.push("Enrolled", { data: EnrolledConfig });
  };

  _onChangeAsync = async () => {
    const image: SnapshotImage = await this.sketch.takeSnapshotAsync({
      format: "png",
    });
    this.setState({ image });
  };

  saveBase64Async = async (image: SnapshotImage) => {
    const cropData = {
      offset: { x: 0, y: 0 },
      size: {
        width: image.width,
        height: image.height,
      },
      displaySize: { width: 600, height: 130 }, // shrink the PNG to this max width and height
      resizeMode: "contain" as "contain", // preserve aspect ratio
    };

    ImageEditor.cropImage(
      image.uri,
      cropData,
      imageURI => {
        ImageStore.getBase64ForTag(
          imageURI,
          (base64Data: string) => {
            console.log(base64Data);
            this.props.dispatch(setSignaturePng(base64Data));
          },
          reason => console.error(reason)
        );
      },
      reason => console.error(reason)
    );

    return true;
  };

  _canProceed = () => {
    return (!!this.state.image || remoteDebugging) && !!this.props.name;
  };

  render() {
    const { t } = this.props;
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        <StatusBar
          canProceed={this._canProceed()}
          progressNumber="80%"
          progressLabel={t("common:statusBar:enrollment")}
          title="4. Would you like to take part in a blood collection?"
          onBack={() => this.props.navigation.pop()}
          onForward={this._onSubmit}
        />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Title label={t(ConsentConfig.title)} />
          <Description content={t(ConsentConfig.description.label)} />
          <Text>
            {this.props.locationType == "childcare"
              ? "daycareText"
              : t("consentFormText")}
          </Text>
        </ScrollView>
        <View style={styles.input}>
          <View style={styles.dateContainer}>
            <Text style={styles.text}>{t("todaysDate")}</Text>
            <Text style={[styles.text, styles.dateText]}>
              {format(new Date(), "MM/D/YYYY")}
            </Text>
          </View>
          <TextInput
            autoFocus={false}
            placeholder={t("fullName")}
            returnKeyType="done"
            value={this.props.name}
            onChange={text => {
              this.props.dispatch(setName(text));
            }}
          />
        </View>
        <View style={styles.sketchContainer}>
          <ExpoPixi.Signature
            ref={(ref: any) => (this.sketch = ref)}
            style={styles.sketch}
            onChange={this._onChangeAsync}
          />
          <Text style={styles.textHint}>{t("signature")}</Text>
        </View>
        <View style={styles.buttonRow}>
          {ConsentConfig.buttons.map(button => (
            <Button
              enabled={button.key === "submit" ? this._canProceed() : true}
              key={button.key}
              label={t("surveyButton:" + button.key)}
              onPress={() => {
                if (button.key === "submit") {
                  this._onSubmit();
                } else {
                  this._onClear();
                }
              }}
              primary={button.primary}
            />
          ))}
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    marginHorizontal: 20,
  },
  buttonRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 30,
  },
  input: {
    marginHorizontal: 30,
  },
  sketch: {
    borderRadius: 13,
    flex: 1,
    zIndex: 10,
  },
  sketchContainer: {
    backgroundColor: "white",
    borderRadius: 13,
    height: "14%",
    marginHorizontal: 30,
    marginTop: 10,
    minHeight: 130,
    overflow: "hidden",
  },
  textHint: {
    color: "#aaa",
    left: 20,
    bottom: 8,
    zIndex: 20,
    position: "absolute",
  },
  dateContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    borderBottomColor: "#bbb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 30,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  dateText: {
    color: "#8E8E93",
  },
  text: {
    alignSelf: "stretch",
    fontSize: 20,
  },
});

export default withNamespaces("consentScreen")<Props>(ConsentScreen);
