import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action, StoreState, setEmail } from "../../../store";
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
  id: 'Inelligible',
  title: 'thankYouParticipating',
  description: {
    label: 'youDoNotQualify',
  },
}

@connect((state: StoreState) => ({ email: state.form!.email }))
class InelligibleScreen extends React.PureComponent<Props & WithNamespaces> {
  _onDone = () => {
    // TODO: write doc (completed)
    // TODO: clear state
    this.props.navigation.popToTop();
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
            returnKeyType="done"
            value={this.props.email && this.props.email}
            onChange={text => this.props.dispatch(setEmail(text))}
            onSubmit={this._onDone}
          />
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

export default withNamespaces("inelligibleScreen")<Props>(InelligibleScreen);
