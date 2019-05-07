// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Picker, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { LocaleConfig } from "../../i18n/LocaleConfig";
import Modal from "./Modal";

interface Props {
  language: string;
  visible: boolean;
  onDismiss(language: string): void;
}

interface State {
  language: string;
}

class LanguageModal extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = {
      language: props.language,
    };
  }

  render() {
    const { t } = this.props;
    return (
      <Modal
        height={280}
        width={350}
        submitText={t("common:button:done")}
        visible={this.props.visible}
        onDismiss={() => this.props.onDismiss(this.props.language)}
        onSubmit={() => this.props.onDismiss(this.state.language)}
      >
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={this.state.language}
            style={{ height: 50, width: 300 }}
            onValueChange={(language: string) => this.setState({ language })}
          >
            {Object.keys(LocaleConfig).map(code => (
              <Picker.Item
                label={LocaleConfig[code].languageName}
                value={code}
                key={code}
              />
            ))}
          </Picker>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  pickerContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
});

export default withNamespaces("languages")(LanguageModal);
