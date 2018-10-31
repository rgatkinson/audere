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
  formId: string;
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
}

@connect((state: StoreState) => ({ formId: state.form!.formId }))
export default class WelcomeScreen extends React.Component<Props> {
  _onNext= () => {
    // TODO: write a class that takes the current state in redux and generates a JSON document to upload.
    this.props.screenProps.uploader.save(this.props.formId, { "name": "data!" });

    this.props.navigation.push('Age');
  }

  render() {
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title bold={true} label="Welcome to the Seattle Flu Study" />
          <Description
            content="The goal of this study is to determine the rate and spread of respiratory viruses in an urban area. Respiratory viruses commonly infect adults and children. Infection is usually mild in healthy adults and children, leading to runny noses, coughing, and wheezing. However, infection can become more serious, especially in older and very young people and those with lung diseases or weak immune systems"
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
