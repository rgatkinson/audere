import React from "react";
import { NavigationScreenProp } from "react-navigation";
import ContentContainer from "../../components/ContentContainer";
import Description from "../../components/Description";
import ScreenContainer from "../../components/ScreenContainer";
import SimpleStatusBar from "../../components/SimpleStatusBar";
import Title from "../../components/Title";

interface Props {
  navigation: NavigationScreenProp<any, any>;
}

export default class PassBackScreen extends React.PureComponent<Props> {
  render() {
    return (
      <ScreenContainer>
        <SimpleStatusBar title="Questionnaire complete!" />
        <ContentContainer>
          <Title label="Please return this tablet to Seattle Flu Study Staff." />
          <Description content="They will assist you with the next step." />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}
