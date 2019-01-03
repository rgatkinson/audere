import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import { ConsentInfo } from "audere-lib";
import Button from "../../components/Button";
import ContentContainer from "../../components/ContentContainer";
import Text from "../../components/Text";
import Title from "../../components/Title";
import ScreenContainer from "../../components/ScreenContainer";
import StatusBar from "../../components/StatusBar";
import { WithNamespaces, withNamespaces } from "react-i18next";

interface Props {
  assent?: ConsentInfo;
  bloodConsent?: ConsentInfo;
  navigation: NavigationScreenProp<any, any>;
}

@connect((state: StoreState) => ({
  assent: state.form.assent,
  bloodConsent: state.form.bloodConsent,
}))
class PaperConsentScreen extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <ScreenContainer>
        <StatusBar
          canProceed={true}
          progressNumber="100%"
          progressLabel={t("common:statusBar:enrollment")}
          title=""
          onBack={() => this.props.navigation.pop()}
          onForward={() => {
            this.props.navigation.push("SurveyStart");
          }}
        />
        <ContentContainer>
          <Title
            label={t("getACopy", {
              plural:
                this.props.assent != null || this.props.bloodConsent != null
                  ? "s"
                  : "",
            })}
          />
          <Text
            content={t("paperConsent", {
              additional:
                this.props.assent != null
                  ? t("assent")
                  : this.props.bloodConsent != null
                    ? t("subStudy")
                    : "",
            })}
          />
          <Button
            enabled={true}
            primary={true}
            label={t("common:button:done")}
            onPress={() => this.props.navigation.push("SurveyStart")}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

export default withNamespaces("paperConsentScreen")<Props>(PaperConsentScreen);
