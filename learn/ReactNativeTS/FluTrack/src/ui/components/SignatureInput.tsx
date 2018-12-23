import React from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { WithNamespaces, withNamespaces } from "react-i18next";
import Button from "./Button";
import Description from "./Description";
import SignatureBox from "./SignatureBox";
import { ConsentInfo, ConsentInfoSignerType } from "audere-lib";

interface Props {
  consent?: ConsentInfo;
  editableNames: boolean;
  participantName?: string;
  signerName?: string;
  signerType: ConsentInfoSignerType;
  onSubmit(name: string, signerType: ConsentInfoSignerType, signerName: string, signature: string): void;
}

interface State {
  open: boolean;
}

class SignatureInput extends React.Component<Props & WithNamespaces> {
  state: State = {
    open: false,
  };

  _signed = (): boolean => {
    return !!this.props.consent && this.props.consent.signerType === this.props.signerType;
  }

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        <Button
          checked={this._signed()}
          enabled={true}
          label={t(this.props.signerType)}
          primary={false}
          onPress={() => {this.setState({ open: true })}}
        />
        <SignatureBox
          editableNames={this.props.editableNames}
          open={this.state.open}
          signer={this.props.signerType}
          participantName={this.props.participantName}
          signerName={this.props.signerName}
          label={t(this.props.signerType)}
          onDismiss={() => this.setState({ open: false })}
          onSubmit={(name: string, signerName: string, signature: string) => {
            this.props.onSubmit(name, this.props.signerType, signerName, signature);
            this.setState({ open: false });
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});

export default withNamespaces("signatureInput")(SignatureInput);
