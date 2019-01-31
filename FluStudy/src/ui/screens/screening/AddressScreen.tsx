import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Address, StoreState, SurveyResponse } from "../../../store";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { AddressConfig } from "../../../resources/ScreenConfig";
import AddressInput from "../../components/AddressInput";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import NavigationBar from "../../components/NavigationBar";
import ScreenContainer from "../../components/ScreenContainer";
import Step from "../../components/Step";
import Text from "../../components/Text";
import Title from "../../components/Title";

interface Props {
  name: string;
  navigation: NavigationScreenProp<any, any>;
  responses: SurveyResponse[];
}

interface State {
  address?: Address;
}

@connect((state: StoreState) => ({
  name: state.form.name,
  responses: state.form.responses,
}))
class AddressScreen extends React.Component<
  Props & WithNamespaces & ReduxWriterProps,
  State
> {
  constructor(props: Props & WithNamespaces & ReduxWriterProps) {
    super(props);
    const addressResponse = props.responses.find(
      response => response.questionId === AddressConfig.id
    );
    if (
      addressResponse != null &&
      addressResponse.answer != null &&
      addressResponse.answer.addressInput != null
    ) {
      this.state = {
        address: addressResponse.answer.addressInput,
      };
    } else {
      this.state = {
        address: {
          name: props.name,
        },
      };
    }
  }

  _onDone = () => {
    this.props.updateAnswer({
      addressInput: this.state.address,
    });
    this.props.navigation.push("Confirmation");
  };

  _haveValidAddress = (): boolean => {
    const address = this.state.address;
    return (
      !!address &&
      !!address.name &&
      !!address.address &&
      !!address.city &&
      !!address.state &&
      !!address.zipcode
    );
  };

  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <NavigationBar
          canProceed={this._haveValidAddress()}
          navigation={this.props.navigation}
          onNext={this._onDone}
        />
        <ContentContainer>
          <Step step={5} totalSteps={5} />
          <Title label={t("surveyTitle:" + AddressConfig.title)} />
          <Text
            content={t("surveyDescription:" + AddressConfig.description!.label)}
          />
          <AddressInput
            value={this.state.address}
            onChange={(address: Address) => this.setState({ address })}
            onDone={() => {
              if (this._haveValidAddress()) {
                this._onDone();
              }
            }}
          />
          <Button
            enabled={this._haveValidAddress()}
            label={t("common:button:submit")}
            primary={true}
            onPress={this._onDone}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default reduxWriter(withNamespaces()(AddressScreen));
