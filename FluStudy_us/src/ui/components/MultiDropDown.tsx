// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { RefObject } from "react";
import { StyleSheet, View } from "react-native";
import MultiSelect from "react-native-multiple-select";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { getAnswer } from "../../util/survey";
import { Action, updateAnswer, StoreState } from "../../store";
import { MultiDropDownQuestion } from "audere-lib/chillsQuestionConfig";
import { Option } from "../../store/types";
import {
  GUTTER,
  HIGHLIGHT_STYLE,
  SECONDARY_COLOR,
  SMALL_TEXT,
  TEXT_COLOR,
} from "../styles";

interface Props {
  question: MultiDropDownQuestion;
  highlighted?: boolean;
  options?: Option[];
  dispatch(action: Action): void;
}

const emptyList = (data: string[]) =>
  data.map(option => {
    return {
      key: option,
      selected: false,
    };
  });

class MultiDropDown extends React.PureComponent<Props & WithNamespaces> {
  _multiSelect: MultiSelect | null = null;

  _getData = () => {
    const { options, question } = this.props;
    return !!options ? options : emptyList(question.options);
  };

  onSelectedItemsChange = (selectedItems: string[]) => {
    const { dispatch, question } = this.props;
    let newOptions = this._getData().map(option => {
      return {
        key: option.key,
        selected:
          selectedItems.findIndex(selectedItem => {
            return selectedItem === option.key;
          }) >= 0,
      };
    });
    dispatch(updateAnswer({ options: newOptions }, question));
  };

  render() {
    const { highlighted, question, t } = this.props;
    const options = this._getData();
    return (
      <View style={[styles.container, highlighted && HIGHLIGHT_STYLE]}>
        <MultiSelect
          ref={component => {
            this._multiSelect = component;
          }}
          items={options.map(option => {
            return { id: option.key, name: t(`surveyOption:${option.key}`) };
          })}
          uniqueKey="id"
          selectText={t(`surveyOption:${question.placeholder}`)}
          onSelectedItemsChange={this.onSelectedItemsChange}
          selectedItems={options
            .filter(option => {
              return option.selected;
            })
            .map(option => {
              return option.key;
            })}
          filterMethod="full"
          fontSize={SMALL_TEXT}
          itemFontSize={SMALL_TEXT}
          itemTextColor={TEXT_COLOR}
          searchInputStyle={{ fontSize: SMALL_TEXT, marginVertical: 5.5 }}
          selectedItemTextColor={SECONDARY_COLOR}
          selectedItemIconColor={SECONDARY_COLOR}
          styleInputGroup={{ marginLeft: -16 }}
          styleDropdownMenuSubsection={{ paddingRight: 0 }}
          submitButtonColor={SECONDARY_COLOR}
          textColor={TEXT_COLOR}
          tagTextColor={SECONDARY_COLOR}
          tagBorderColor={SECONDARY_COLOR}
          tagRemoveIconColor={SECONDARY_COLOR}
        />
      </View>
    );
  }
}
export default connect((state: StoreState, props: Props) => ({
  options: getAnswer(state, props.question),
}))(withNamespaces()(MultiDropDown));

const styles = StyleSheet.create({
  container: {
    marginBottom: GUTTER / 2,
  },
});
