import React from "react";
import { StoreState } from "../../../store/index";
import { connect } from "react-redux";
import { NavigationScreenProp } from "react-navigation";
import Button from "./components/Button";
import ContentContainer from "./components/ContentContainer";
import Description from "./components/Description";
import Title from "./components/Title";
import ScreenContainer from './components/ScreenContainer';

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class SurveyStartScreen extends React.Component<Props> {
  _onNext= () => {
    this.props.navigation.push('Survey');
  }

  render() {
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title label="Study Questionnaire" />
          <Description
            content="You are now enrolled in the Seattle Flu Study. Please answer the following questions about household composition and exposure, illness history, and demographic information."
          />
          <Button
            enabled={true}
            primary={true}
            label="Get Started"
            onPress={this._onNext}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
