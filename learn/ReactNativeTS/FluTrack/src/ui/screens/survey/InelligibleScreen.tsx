import React from "react";
import { StyleSheet, Text } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, completeSurvey, setEmail } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import EmailInput from "../../components/EmailInput";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Title from "../../components/Title";

interface Props {
  dispatch(action: Action): void;
  email: string;
  navigation: NavigationScreenProp<any, any>;
}

const InelligibleConfig = {
  id: "Inelligible",
  title: "thankYouParticipating",
  description: {
    label: "youDoNotQualify",
  },
};

interface State {
  email?: string;
}

@connect((state: StoreState) => ({ email: state.form!.email }))
class InelligibleScreen extends React.PureComponent<
  Props & WithNamespaces,
  State
> {
  state: State = {};

  emailInput = React.createRef<EmailInput>();

  _onDone = () => {
    if (!!this.state.email && this.emailInput.current!.isValid()) {
      this.props.dispatch(setEmail(this.state.email));
    }
    this.props.dispatch(completeSurvey());
    this.props.navigation.popToTop();
  };

  _getEmail = (): string => {
    return typeof this.state.email !== "undefined"
      ? this.state.email
      : this.props.email;
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title label={t(InelligibleConfig.title)} />
          <Description content={t(InelligibleConfig.description.label)} />
          <EmailInput
            autoFocus={true}
            placeholder={t("emailAddress")}
            ref={this.emailInput}
            returnKeyType="done"
            validationError={t("validationError")}
            value={this._getEmail()}
            onChange={text => this.setState({ email: text })}
            onSubmit={() => {
              if (this.emailInput.current!.isValid()) {
                this._onDone();
              }
            }}
          />
          <Text style={styles.disclaimer}>{t("disclaimer")}</Text>
          <Button
            primary={true}
            enabled={true}
            label={t("common:button:done")}
            onPress={this._onDone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  disclaimer: {
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    letterSpacing: -0.41,
    lineHeight: 26,
    marginVertical: 20,
  },
});

export default withNamespaces("inelligibleScreen")<Props>(InelligibleScreen);
