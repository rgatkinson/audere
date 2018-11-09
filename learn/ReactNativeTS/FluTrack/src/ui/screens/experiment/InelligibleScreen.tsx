import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { setEmail, Action } from "../../../store";
import Button from "./components/Button";
import ContentContainer from "./components/ContentContainer";
import Description from "./components/Description";
import EmailInput from "./components/EmailInput";
import ScreenContainer from "./components/ScreenContainer";
import StatusBar from "./components/StatusBar";
import Title from "./components/Title";

interface Props {
  dispatch(action: Action): void;
  email: string;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({ email: state.form!.email }))
export default class InelligibleScreen extends React.PureComponent<Props> {
  _onDone = () => {
    // TODO: write doc (completed)
    // TODO: clear state
    this.props.navigation.popToTop();
  };

  render() {
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={true}
          title="3. What symptoms have you experienced..."
          onBack={() => this.props.navigation.pop()}
          onForward={this._onDone}
        />
        <ContentContainer>
          <Title label="Thank you for participating." />
          <Description content="You do not qualify for the Seattle Flu Study at this time. Please provide your email address below if you are interested in learning more about this study and related topics in the future." />
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
            label="Done"
            onPress={this._onDone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
