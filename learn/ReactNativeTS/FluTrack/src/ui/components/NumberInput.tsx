import React from "react";
import { ReturnKeyTypeOptions, StyleProp, TextStyle } from "react-native";
import TextInput from "./TextInput";

interface Props {
  autoFocus?: boolean;
  placeholder: string;
  placeholderTextColor?: string;
  returnKeyType: ReturnKeyTypeOptions;
  style?: StyleProp<TextStyle>;
  value?: string;
  onChangeText(text: string): void;
  onSubmitEditing(): void;
}

interface State {
  text?: string;
}

export default class NumberInput extends React.Component<Props, State> {
  textInput = React.createRef<TextInput>();

  constructor(props: Props) {
    super(props);
    this.state = {
      text: props.value,
    };
  }

  onChangeText = (text: string) => {
    const numbers = "0123456789";
    const newText = text.replace(/[^0-9]/g, "");
    this.setState({ text: newText });
    this.props.onChangeText(newText);
  };

  render() {
    return (
      <TextInput
        autoCorrect={false}
        autoFocus={this.props.autoFocus}
        keyboardType="numbers-and-punctuation"
        placeholder={this.props.placeholder}
        placeholderTextColor={this.props.placeholderTextColor}
        ref={this.textInput}
        returnKeyType={this.props.returnKeyType}
        style={this.props.style}
        value={this.state.text}
        onChangeText={this.onChangeText}
        onSubmitEditing={this.props.onSubmitEditing}
      />
    );
  }

  focus() {
    this.textInput.current!.focus();
  }
}
