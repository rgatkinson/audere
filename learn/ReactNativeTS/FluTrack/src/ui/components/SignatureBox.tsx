import React from "react";
import {
  Alert,
  ImageEditor,
  ImageStore,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import * as ExpoPixi from "expo-pixi";
import KeyboardListener from "react-native-keyboard-listener";
import Button from "./Button";
import Modal from "./Modal";
import TextInput from "./TextInput";
import { ConsentInfoSignerType } from "audere-lib/snifflesProtocol";

interface Props {
  editableNames: boolean;
  participantName?: string;
  signerName?: string;
  label: string;
  relation?: string;
  signer: ConsentInfoSignerType;
  open: boolean;
  onDismiss(): void;
  onSubmit(
    participantName: string,
    signerName: string,
    signature: string,
    relation?: string
  ): void;
}

interface SnapshotImage {
  height: number;
  width: number;
  uri: string;
}

interface State {
  image?: SnapshotImage;
  keyboardOpen?: boolean;
  participantName?: string;
  signerName?: string;
  relation?: string;
}

// @ts-ignore
const remoteDebugging = typeof DedicatedWorkerGlobalScope !== "undefined";

class SignatureBox extends React.Component<Props & WithNamespaces, State> {
  secondInput = React.createRef<TextInput>();
  thirdInput = React.createRef<TextInput>();

  state: State = {};

  sketch: any;

  _onChangeAsync = async () => {
    const image: SnapshotImage = await this.sketch.takeSnapshotAsync({
      format: "png",
    });
    this.setState({ image });
  };

  _onClear = () => {
    this.sketch.clear();
    this.setState({ image: undefined });
  };

  _getParticipantName = (): string | undefined => {
    return typeof this.state.participantName == "undefined"
      ? this.props.participantName
      : this.state.participantName;
  };

  _getRelation = (): string | undefined => {
    return typeof this.state.relation == "undefined"
      ? this.props.relation
      : this.state.relation;
  };

  _getSignerName = (): string | undefined => {
    if (this.props.signer === ConsentInfoSignerType.Subject) {
      return this._getParticipantName();
    }
    return typeof this.state.signerName == "undefined"
      ? this.props.signerName
      : this.state.signerName;
  };

  _onSubmit = () => {
    const image = this.state.image;
    const participantName = this._getParticipantName()!;
    const signerName = this._getSignerName()!;
    if (!image && !remoteDebugging) {
      Alert.alert(this.props.t("pleaseSign"));
      return;
    } else if (remoteDebugging) {
      this.props.onSubmit(
        participantName,
        signerName,
        "debugSignature",
        this._getRelation()
      );
    } else if (!!image) {
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
              this.props.onSubmit(
                participantName,
                signerName,
                base64Data,
                this._getRelation()
              );
            },
            reason => console.error(reason)
          );
        },
        reason => console.error(reason)
      );
    }
  };

  _getModalHeight = (signer: ConsentInfoSignerType): number => {
    if (signer === ConsentInfoSignerType.Subject) {
      return 425;
    } else if (
      signer === ConsentInfoSignerType.Parent ||
      signer === ConsentInfoSignerType.Researcher
    ) {
      return 525;
    } else {
      return 625;
    }
  };

  _canSave = () => {
    return (
      !!this._getParticipantName() &&
      (remoteDebugging || !!this.state.image) &&
      (this.props.signer === ConsentInfoSignerType.Subject ||
        !!this._getSignerName()) &&
      (this.props.signer !== ConsentInfoSignerType.Representative ||
        !!this._getRelation())
    );
  };

  render() {
    const { t } = this.props;
    return (
      <Modal
        height={this._getModalHeight(this.props.signer)}
        width={700}
        title={this.props.label}
        visible={this.props.open}
        onDismiss={() => {
          this.setState({
            image: undefined,
            participantName: undefined,
            signerName: undefined,
          });
          this.props.onDismiss();
        }}
      >
        <View style={styles.container}>
          <KeyboardListener
            onWillShow={() => {
              this.setState({ keyboardOpen: true });
            }}
            onWillHide={() => {
              this.setState({ keyboardOpen: false });
            }}
          />
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.headerText}>{t("todaysDate")}</Text>
            <Text style={styles.inputContainer}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerText}>{t("fullName")}</Text>
            <TextInput
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={
                this.props.editableNames && !this._getParticipantName()
              }
              editable={this.props.editableNames}
              placeholder={
                t("name") + (this.state.keyboardOpen ? "" : t("required"))
              }
              placeholderTextColor={this.state.keyboardOpen ? undefined : "red"}
              returnKeyType={this._canSave() ? "done" : "next"}
              style={styles.inputContainer}
              value={this._getParticipantName()}
              onChangeText={text => this.setState({ participantName: text })}
              onSubmitEditing={() => {
                if (this._canSave()) {
                  this._onSubmit();
                } else if (this.secondInput.current != null) {
                  this.secondInput.current.focus();
                } else if (this.thirdInput.current != null) {
                  this.thirdInput.current.focus();
                }
              }}
            />
          </View>
          {this.props.signer != ConsentInfoSignerType.Subject ? (
            <View>
              <Text style={styles.headerText}>
                {t(this.props.signer + "FullName")}
              </Text>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus={
                  this.props.editableNames &&
                  !!this._getParticipantName() &&
                  !this._getSignerName()
                }
                editable={this.props.editableNames}
                placeholder={
                  t("name") + (this.state.keyboardOpen ? "" : t("required"))
                }
                placeholderTextColor={
                  this.state.keyboardOpen ? undefined : "red"
                }
                ref={this.secondInput}
                returnKeyType={this._canSave() ? "done" : "next"}
                style={styles.inputContainer}
                value={this._getSignerName()}
                onChangeText={text => this.setState({ signerName: text })}
                onSubmitEditing={() => {
                  if (this._canSave()) {
                    this._onSubmit();
                  } else if (this.thirdInput.current != null) {
                    this.thirdInput.current!.focus();
                  }
                }}
              />
            </View>
          ) : null}
          {this.props.signer === ConsentInfoSignerType.Representative ? (
            <View>
              <Text style={styles.headerText}>
                {t("relationToParticipant")}
              </Text>
              <TextInput
                autoCapitalize="words"
                autoFocus={
                  this.props.editableNames &&
                  !!this._getParticipantName() &&
                  !!this._getSignerName() &&
                  !this._getRelation()
                }
                editable={this.props.editableNames}
                placeholder={
                  t("relation") + (this.state.keyboardOpen ? "" : t("required"))
                }
                placeholderTextColor={
                  this.state.keyboardOpen ? undefined : "red"
                }
                ref={this.thirdInput}
                returnKeyType={this._canSave() ? "done" : "next"}
                style={styles.inputContainer}
                value={this._getRelation()}
                onChangeText={text => this.setState({ relation: text })}
                onSubmitEditing={() => {
                  if (this._canSave()) {
                    this._onSubmit();
                  }
                }}
              />
            </View>
          ) : null}
          <View style={styles.sketchContainer}>
            <ExpoPixi.Signature
              ref={(ref: any) => (this.sketch = ref)}
              style={styles.sketch}
              onChange={this._onChangeAsync}
            />
            <Text style={styles.textHint}>{this.props.label}</Text>
          </View>
          <View style={styles.buttonRow}>
            <Button
              enabled={true}
              key="clear"
              label={t("surveyButton:clearSignature")}
              primary={false}
              style={{ width: 300 }}
              onPress={this._onClear}
            />
            <Button
              enabled={this._canSave()}
              key="save"
              label={t("common:button:save")}
              primary={true}
              style={{ width: 300 }}
              onPress={this._onSubmit}
            />
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  buttonRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    marginHorizontal: 30,
  },
  headerText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 21,
    letterSpacing: -0.51,
    marginVertical: 10,
  },
  inputContainer: {
    fontSize: 20,
    height: 30,
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  sketch: {
    borderRadius: 13,
    flex: 1,
    zIndex: 10,
  },
  sketchContainer: {
    borderColor: "#d6d7da",
    borderWidth: 2,
    borderRadius: 13,
    height: "14%",
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
});

export default withNamespaces("signatureBox")<Props>(SignatureBox);
