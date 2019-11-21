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
import { connect } from "react-redux";
import { Action, updateAnswer, StoreState } from "../../store";
import { DropDownQuestion } from "audere-lib/chillsQuestionConfig";
import { getSelectedButton } from "../../util/survey";
import Modal from "./Modal";
import Text from "./Text";
import {
  BORDER_COLOR,
  GUTTER,
  HIGHLIGHT_STYLE,
  INPUT_HEIGHT,
  TEXT_COLOR,
  PLACEHOLDER_COLOR,
} from "../styles";

interface DropDownModalProps {
  options: string[];
  placeholder: string;
  selected?: string;
  visible: boolean;
  onDismiss(selected: string | undefined): void;
}

interface DropDownModalState {
  selected?: string;
}

class DropDownModal extends React.Component<
  DropDownModalProps & WithNamespaces,
  DropDownModalState
> {
  constructor(props: DropDownModalProps & WithNamespaces) {
    super(props);
    this.state = {
      selected: props.selected,
    };
  }

  shouldComponentUpdate(
    props: DropDownModalProps & WithNamespaces,
    state: DropDownModalState
  ) {
    return (
      this.state != state ||
      this.props.visible != props.visible ||
      this.props.options != props.options ||
      this.props.placeholder != props.placeholder ||
      this.props.selected != props.selected
    );
  }

  _onValueChange = (value: string) => {
    let selected: string | undefined;
    if (value !== this.props.placeholder) {
      selected = value;
    }
    this.setState({ selected });
    if (Platform.OS === "android") {
      this.props.onDismiss(selected);
    }
  };

  _renderPicker() {
    const { placeholder, t } = this.props;
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          borderBottomColor: BORDER_COLOR,
          borderBottomWidth: StyleSheet.hairlineWidth,
        }}
      >
        <Picker
          selectedValue={
            this.state.selected ? this.state.selected : placeholder
          }
          style={{ alignSelf: "stretch", justifyContent: "center" }}
          onValueChange={this._onValueChange}
        >
          <Picker.Item
            label={t(placeholder)}
            color={PLACEHOLDER_COLOR}
            value={placeholder}
            key={placeholder}
          />
          {this.props.options.map(option => (
            <Picker.Item
              label={t(option)}
              color={TEXT_COLOR}
              value={option}
              key={option}
            />
          ))}
        </Picker>
      </View>
    );
  }

  _onDismiss = () => {
    this.setState({ selected: this.props.selected });
    this.props.onDismiss(this.props.selected);
  };

  _onSubmit = () => {
    this.props.onDismiss(this.state.selected);
  };

  render() {
    const { t, visible } = this.props;
    const { width } = Dimensions.get("window");
    return Platform.OS === "ios" ? (
      <Modal
        height={280}
        width={width * 0.75}
        submitText={t("common:button:done")}
        visible={visible}
        onDismiss={this._onDismiss}
        onSubmit={this._onSubmit}
      >
        {this._renderPicker()}
      </Modal>
    ) : (
      this._renderPicker()
    );
  }
}
const TranslatedModal = withNamespaces("surveyButton")(DropDownModal);

interface Props {
  highlighted?: boolean;
  question: DropDownQuestion;
  selected?: string;
  dispatch(action: Action): void;
}

interface State {
  pickerOpen: boolean;
}

class DropDown extends React.Component<Props & WithNamespaces, State> {
  state = {
    pickerOpen: false,
  };

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return (
      state != this.state ||
      props.highlighted != this.props.highlighted ||
      props.question != this.props.question ||
      props.selected != this.props.selected
    );
  }

  _openPicker = () => {
    this.setState({ pickerOpen: true });
  };

  _onDismiss = (text: string | undefined) => {
    this.setState({ pickerOpen: false });
    this.props.dispatch(
      updateAnswer({ selectedButtonKey: text }, this.props.question)
    );
  };

  render() {
    const { highlighted, question, selected, t } = this.props;
    return (
      <View style={[styles.container, highlighted && HIGHLIGHT_STYLE]}>
        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={this._openPicker}
          >
            <Text
              content={
                !!selected
                  ? t(selected)
                  : t(question.placeholder) + t("common:device:iosHint")
              }
              style={{ color: !!selected ? TEXT_COLOR : PLACEHOLDER_COLOR }}
            />
          </TouchableOpacity>
        )}
        <TranslatedModal
          options={question.buttons.map(buttonConfig => buttonConfig.key)}
          placeholder={question.placeholder}
          selected={!!selected ? selected : undefined}
          visible={this.state.pickerOpen}
          onDismiss={this._onDismiss}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER / 2,
  },
  pickerContainer: {
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    height: INPUT_HEIGHT - GUTTER / 4,
    justifyContent: "center",
    padding: GUTTER / 4,
  },
});
export default connect((state: StoreState, props: Props) => ({
  selected: getSelectedButton(state, props.question),
}))(withNamespaces("surveyButton")(DropDown));
