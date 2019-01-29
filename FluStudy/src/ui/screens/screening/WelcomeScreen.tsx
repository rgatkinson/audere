import React from "react";
import { Dimensions, Image } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, startForm, StoreState } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Text from "../../components/Text";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  dispatch(action: Action): void;
  isDemo: boolean;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  isDemo: !!state.admin.isDemo,
}))
class WelcomeScreen extends React.Component<Props & WithNamespaces> {
  _onNext = () => {
    this.props.dispatch(startForm(this.props.isDemo));
    this.props.navigation.push("Why");
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Image
            style={{ height: 120, width: Dimensions.get("window").width }}
            source={require("../../../img/logo.png")}
          />
          <Title size="small" label={t("welcome")} />
          <Text content={t("description")} />
          <Button
            enabled={true}
            primary={true}
            label={t("common:button:next")}
            onPress={this._onNext}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("welcomeScreen")<Props>(WelcomeScreen);
