import React from "react";
import { StyleSheet } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, completeSurvey, setEmail } from "../../../store";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import EmailInput from "../../components/EmailInput";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import Text from "../../components/Text";
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
  valid: boolean;
}

@connect((state: StoreState) => ({ email: state.form!.email }))
class InelligibleScreen extends React.PureComponent<
  Props & WithNamespaces,
  State
> {
  _onDone = () => {
    if (!!this.state.email && this.state.valid) {
      this.props.dispatch(setEmail(this.state.email));
    }
    this.props.dispatch(completeSurvey());
    this.props.navigation.popToTop();
  };

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { email: props.email, valid: !!props.email };
  }

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title label={t(InelligibleConfig.title)} />
          <Text content={t(InelligibleConfig.description.label)} />
          <EmailInput
            autoFocus={true}
            placeholder={t("emailAddress")}
            returnKeyType="done"
            validationError={t("validationError")}
            value={this.state.email}
            onChange={(email, valid) => this.setState({ email, valid })}
            onSubmit={valid => {
              this.setState({ valid });
              if (valid) {
                this._onDone();
              }
            }}
          />
          <Text content={t("disclaimer")} style={styles.disclaimer} />
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
    fontSize: 17,
  },
});

export default withNamespaces("inelligibleScreen")<Props>(InelligibleScreen);
