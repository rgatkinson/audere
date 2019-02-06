import React from "react";
import { connect } from "react-redux";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { Action, StoreState, setAssent } from "../../../store";
import {
  ConsentInfo,
  ConsentInfoSignerType,
} from "audere-lib/snifflesProtocol";
import { EnrolledConfig } from "../../../resources/ScreenConfig";
import { NavigationScreenProp } from "react-navigation";
import { format } from "date-fns";
import ConsentChrome from "../../components/ConsentChrome";
import SignatureInput from "../../components/SignatureInput";

interface Props {
  assent?: ConsentInfo;
  dispatch(action: Action): void;
  navigation: NavigationScreenProp<any, any>;
  name: string;
}

@connect((state: StoreState) => ({
  assent: state.form.assent,
  name: state.form!.name,
}))
class AssentScreen extends React.Component<Props & WithNamespaces> {
  _onSubmit = (
    participantName: string,
    signerType: ConsentInfoSignerType,
    signerName: string,
    signature: string
  ) => {
    this.props.dispatch(
      setAssent({
        name: signerName,
        terms:
          this.props.t("assentFormHeader") +
          "\n" +
          this.props.t("assentFormText"),
        signerType,
        date: format(new Date(), "YYYY-MM-DD"), // FHIR:date
        signature,
      })
    );
    this._proceed();
  };

  _proceed = () => {
    this.props.navigation.push("Enrolled", { data: EnrolledConfig });
  };

  render() {
    const { t } = this.props;
    return (
      <ConsentChrome
        canProceed={!!this.props.assent}
        progressNumber="80%"
        navigation={this.props.navigation}
        title={t("assentTitle")}
        proceed={this._proceed}
        header={t("assentFormHeader")}
        terms={t("assentFormText")}
      >
        <SignatureInput
          consent={this.props.assent}
          editableNames={false}
          participantName={this.props.name}
          signerType={ConsentInfoSignerType.Subject}
          onSubmit={this._onSubmit}
        />
      </ConsentChrome>
    );
  }
}

export default withNamespaces("assentScreen")<Props>(AssentScreen);
