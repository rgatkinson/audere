import React from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, setDemo } from "../../store";
import Text from "./Text";
import { GUTTER, LOGO_HEIGHT } from "../styles";

interface Props {
  isDemo?: boolean;
  dispatch?(action: Action): void;
}

const TRIPLE_PRESS_DELAY = 500;

@connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))
class Logo extends React.Component<Props> {
  lastTap: number | null = null;
  secondLastTap: number | null = null;

  handleTripleTap = () => {
    const now = Date.now();
    if (
      this.lastTap != null &&
      this.secondLastTap != null &&
      now - this.secondLastTap! < TRIPLE_PRESS_DELAY
    ) {
      this.props.dispatch!(setDemo(!this.props.isDemo));
    } else {
      this.secondLastTap = this.lastTap;
      this.lastTap = now;
    }
  };

  render() {
    return (
      <TouchableWithoutFeedback
        style={{ alignSelf: "stretch" }}
        onPress={this.handleTripleTap}
      >
        <View>
          <Image
            style={{
              aspectRatio: 3.12,
              height: undefined,
              width: Dimensions.get("window").width,
            }}
            source={require("../../img/logo.png")}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

export default Logo;
