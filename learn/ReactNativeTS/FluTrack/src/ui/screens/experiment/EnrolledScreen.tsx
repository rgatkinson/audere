import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { setEmail, Action } from "../../../store";
import Button from './components/Button';
import ContentContainer from "./components/ContentContainer";
import Description from './components/Description';
import EmailInput from './components/EmailInput';
import OptionList from './components/OptionList';
import ScreenContainer from './components/ScreenContainer';
import Title from './components/Title';

interface Props {
  dispatch(action: Action): void;
  email: string;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({ email: state.form!.email }))
export default class EnrolledScreen extends React.PureComponent<Props> {
  state = {
    selected: new Map<string, boolean>(),
  };

  options = [
    'To receive a copy of my consent',
    'To complete a short questionaire about how my illness has progressed',
    'To learn more about this study and related topics',
    'All of the above',
    'None of the above (I do not want to be contacted at all.)',
  ];

  _onDone= () => {
    // TODO: write doc 
    this.props.navigation.push('SurveyStart');
  }

  render() {
    return (
      <ScreenContainer>
        <View style={styles.statusBar}>
          <Text style={styles.statusBarTitle}>
            Enrollment complete!
          </Text>
        </View>
        <ContentContainer>
          <Title label="We would like to follow up with you via email." />
          <Description
            content="Please confirm the situations in which you are willing to be contacted, and provide your email address (optional)."
          />
          <OptionList
            data={this.options}
            numColumns={1}
            onChange={(selected) => this.setState({selected})}
          />
          <EmailInput
            returnKeyType='done'
            value={this.props.email && this.props.email}
            onChange={(text) => this.props.dispatch(setEmail(text))}
            onSubmit={this._onDone}
          />
          <Button primary={true} enabled={true} label="Done" onPress={this._onDone} />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  statusBar: {
    backgroundColor: '#d3d0af',
    height: 100,
    justifyContent: 'center',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowRadius: 2,
    shadowOpacity: 0.5, 
  },
  statusBarTitle: {
    fontSize: 22,
  },
});
