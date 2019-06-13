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
import {
  DropDownQuestion,
  SurveyQuestion,
} from "../../resources/QuestionConfig";
import Modal from "./Modal";
import Text from "./Text";
import {
  BORDER_COLOR,
  GUTTER,
  HIGHLIGHT_STYLE,
  INPUT_HEIGHT,
  LINK_COLOR,
  SECONDARY_COLOR,
} from "../styles";

interface DropDownModalProps {
  options: string[];
  placeholder: string;
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
      this.state.selected != state.selected ||
      this.props.visible != props.visible
    );
  }

  _onValueChange = (value: string) => {
    const { placeholder, t } = this.props;
    if (value === placeholder) {
      this.setState({ selected: null });
    } else {
      this.setState({ selected: value });
      if (Platform.OS === "android") {
        this.props.onDismiss(value);
      }
    }
  };

  _renderPicker() {
    const { placeholder, t } = this.props;
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Picker
          selectedValue={
            this.state.selected ? this.state.selected : placeholder
          }
          style={{ alignSelf: "stretch", justifyContent: "center" }}
          onValueChange={this._onValueChange}
        >
          {this.props.options.map(option => (
            <Picker.Item label={t(option)} value={option} key={option} />
          ))}
          <Picker.Item
            label={t(placeholder)}
            value={placeholder}
            key={placeholder}
          />
        </Picker>
      </View>
    );
  }

  _onDismiss = () => {
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
const TranslatedModal = withNamespaces("dropDown")(DropDownModal);

interface Props {
  highlighted?: boolean;
  question: DropDownQuestion;
  getAnswer(key: string, id: string): any;
  updateAnswer(answer: object, data: SurveyQuestion): void;
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
      state.pickerOpen ||
      this.state.pickerOpen ||
      props.highlighted != this.props.highlighted
    );
  }

  _openPicker = () => {
    this.setState({ pickerOpen: true });
  };

  _onDismiss = (text: string | null) => {
    this.setState({ pickerOpen: false });
    this.props.updateAnswer({ selectedButtonKey: text }, this.props.question);
  };

  render() {
    const { highlighted, question, t, getAnswer } = this.props;
    const selected = getAnswer("selectedButtonKey", question.id);
    const text = (
      <Text
        content={!!selected ? t(selected) : t(question.placeholder)}
        style={{ color: !!selected ? SECONDARY_COLOR : LINK_COLOR }}
      />
    );

    return (
      <View style={[styles.container, highlighted && HIGHLIGHT_STYLE]}>
        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={this._openPicker}
          >
            {text}
          </TouchableOpacity>
        )}
        <TranslatedModal
          options={question.buttons.map(buttonConfig => buttonConfig.key)}
          placeholder={question.placeholder}
          selected={!!selected ? selected : null}
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
    height: INPUT_HEIGHT,
    justifyContent: "center",
    padding: GUTTER / 4,
  },
});
export default withNamespaces("dropDown")(DropDown);
