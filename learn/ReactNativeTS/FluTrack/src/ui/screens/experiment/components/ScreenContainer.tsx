import React from "react";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

interface Props {
  children: any;
}

export default class ScreenContainer extends React.Component<Props> {
  render() {
    return (
      <KeyboardAwareScrollView resetScrollToCoords={{ x: 0, y: 0 }}>
        {this.props.children}
      </KeyboardAwareScrollView>
    );
  }
}
