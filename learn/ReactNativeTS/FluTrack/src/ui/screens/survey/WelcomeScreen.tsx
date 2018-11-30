import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { AgeBucketConfig } from "./AgeScreen";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class WelcomeScreen extends React.Component<Props> {
  _onNext = () => {
    this.props.navigation.push("Age", { data: AgeBucketConfig });
  };

  render() {
    return (
      <ScreenContainer>
        <ContentContainer>
          <Title size="large" label="Welcome to the Seattle Flu Study" />
          <Description content="The goal of this study is to determine the rate and spread of respiratory viruses in an urban area. Respiratory viruses commonly infect adults and children. Infection is usually mild in healthy adults and children, leading to runny noses, coughing, and wheezing. However, infection can become more serious, especially in older and very young people and those with lung diseases or weak immune systems." />
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
