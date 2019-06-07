// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Dimensions,
  Picker,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";
import Text from "./Text";
import {
  BORDER_COLOR,
  GUTTER,
  INPUT_HEIGHT,
  LINK_COLOR,
  SECONDARY_COLOR,
} from "../styles";

interface DropDownModalProps {
  options: string[];
  selected: string | null;
  visible: boolean;
  onDismiss(selected: string | null): void;
}

interface DropDownModalState {
  selected: string | null;
}

class DropDownModal extends React.Component<
  DropDownModalProps & WithNamespaces,
  DropDownModalState
> {
  state = {
    selected: this.props.selected,
  };

  _onValueChange = (value: string) => {
    const { t } = this.props;
    if (value === this.props.t("selectAge")) {
      this.setState({ selected: null });
    } else {
      if (Platform.OS === "android") {
        this.props.onDismiss(t(value));
      }
      this.setState({ selected: value });
    }
  };

  _renderPicker() {
    const { t } = this.props;
    const selectAge = t("selectAge");
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Picker
          selectedValue={this.state.selected ? this.state.selected : selectAge}
          style={{ alignSelf: "stretch", justifyContent: "center" }}
          onValueChange={this._onValueChange}
        >
          {this.props.options.map(option => (
            <Picker.Item label={t(option)} value={t(option)} key={option} />
          ))}
          <Picker.Item label={selectAge} value={selectAge} key={selectAge} />
        </Picker>
      </View>
    );
  }

  render() {
    const { selected, onDismiss, t, visible } = this.props;
    const { width } = Dimensions.get("window");
    return Platform.OS === "ios" ? (
      <Modal
        height={280}
        width={width * 0.75}
        submitText={t("common:button:done")}
        visible={visible}
        onDismiss={() => onDismiss(selected)}
        onSubmit={() => onDismiss(this.state.selected)}
      >
        {this._renderPicker()}
      </Modal>
    ) : (
      this._renderPicker()
    );
  }
}
const TranslatedModal = withNamespaces("dropDown")(DropDownModal);

interface Props {
  options: any[];
  placeholder: string;
  selected: string | null;
  onChange(text: string | null): void;
}

class DropDown extends React.Component<Props & WithNamespaces> {
  state = {
    pickerOpen: false,
  };

  _getOptions(): string[] {
    const { options } = this.props;

    return options.map((item: any) => {
      return item.key;
    });
  }

  render() {
    const { onChange, placeholder, selected, t } = this.props;

    return (
      <View style={{ alignSelf: "stretch", marginBottom: GUTTER / 2 }}>
        {Platform.OS === "ios" ? (
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => this.setState({ pickerOpen: true })}
          >
            <Text
              content={!!selected ? t(selected) : t(placeholder)}
              style={{ color: !!selected ? SECONDARY_COLOR : LINK_COLOR }}
            />
          </TouchableOpacity>
        ) : (
          <Text
            content={!!selected ? t(selected) : t(placeholder)}
            style={{ color: !!selected ? SECONDARY_COLOR : LINK_COLOR }}
          />
        )}
        <TranslatedModal
          options={this.props.options}
          selected={!!selected ? selected : null}
          visible={this.state.pickerOpen}
          onDismiss={(text: string | null) => {
            this.setState({ pickerOpen: false });
            onChange(text);
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  pickerContainer: {
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    height: INPUT_HEIGHT,
    justifyContent: "center",
    padding: GUTTER / 4,
  },
});
export default withNamespaces("dropDown")(DropDown);
