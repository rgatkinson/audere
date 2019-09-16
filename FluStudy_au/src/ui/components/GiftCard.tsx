import React, { Component, Fragment } from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StyleSheet, View } from "react-native";
import Text from "../components/Text";
import { StoreState } from "../../store";
import Divider from "./Divider";
import {
  GUTTER,
  THICK_BORDER_WIDTH,
  PRIMARY_COLOR,
  BORDER_RADIUS,
  SECONDARY_COLOR,
} from "../styles";
import { Linking } from "expo";
import Button from "./Button";
import { logFirebaseEvent, AppEvents } from "../../util/tracker";
import { GiftcardFailureReason } from "audere-lib/coughProtocol";
import {
  getGiftCard,
  checkGiftcardAvailability,
} from "../../transport/Giftcards";
import { NavigationScreenProp, withNavigation } from "react-navigation";
import { emailSupport } from "../../resources/LinkConfig";
import { getRemoteConfig } from "../../util/remoteConfig";

interface Props {
  barcode: string;
  completed48HoursAgo: boolean;
  giftCardAmount: string;
  isConnected: boolean;
  isDemo: boolean;
  navigation: NavigationScreenProp<any, any>;
}

interface State {
  failureReason: GiftcardFailureReason | "";
}

class GiftCard extends Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { failureReason: "" };
  }

  async componentDidMount() {
    const { barcode, giftCardAmount, isDemo } = this.props;
    const giftCardsAvailable = getRemoteConfig("giftCardsAvailable");
    const { failureReason } = this.state;
    const invalidBarcode =
      failureReason === GiftcardFailureReason.INVALID_BARCODE;
    const cardsExhausted =
      failureReason === GiftcardFailureReason.CARDS_EXHAUSTED;
    const APIError =
      failureReason === GiftcardFailureReason.API_ERROR ||
      failureReason === GiftcardFailureReason.INVALID_INSTALLATION_ID;

    const response = await checkGiftcardAvailability(
      barcode,
      parseInt(giftCardAmount),
      isDemo
    );

    if (!!response.failureReason) {
      this.setState({ failureReason: response.failureReason });
    }

    if (
      !isDemo &&
      giftCardsAvailable &&
      !invalidBarcode &&
      !APIError &&
      !cardsExhausted
    ) {
      logFirebaseEvent(AppEvents.GIFT_CARD_LINK_SHOWN);
    }
  }

  _onRedeemPress = async () => {
    const { barcode, giftCardAmount, isDemo } = this.props;

    if (!isDemo) {
      logFirebaseEvent(AppEvents.GIFT_CARD_LINK_PRESSED);
    }

    const response = await getGiftCard(
      barcode,
      parseInt(giftCardAmount),
      isDemo
    );

    if (!!response.failureReason) {
      this.setState({ failureReason: response.failureReason });
    } else if (!!response.giftcard) {
      this.setState({ failureReason: "" });
      Linking.openURL(response.giftcard.url);
    }
  };

  _navToFAQ = () => {
    this.props.navigation.navigate("GeneralQuestions");
  };

  render() {
    const { completed48HoursAgo, giftCardAmount, isConnected, t } = this.props;
    const { failureReason } = this.state;
    const giftCardsAvailable = getRemoteConfig("giftCardsAvailable");
    const invalidBarcode =
      failureReason === GiftcardFailureReason.INVALID_BARCODE;
    const cardsExhausted =
      failureReason === GiftcardFailureReason.CARDS_EXHAUSTED;
    const APIError =
      failureReason === GiftcardFailureReason.API_ERROR ||
      failureReason === GiftcardFailureReason.INVALID_INSTALLATION_ID;

    const thankYouText = giftCardsAvailable
      ? completed48HoursAgo
        ? cardsExhausted
          ? "surveyNoGiftCard"
          : "surveyGiftCard"
        : cardsExhausted
        ? "noSurveyNoGiftCard"
        : "noSurveyGiftCard"
      : "desc";

    const giftcardText = giftCardsAvailable
      ? isConnected
        ? invalidBarcode
          ? "invalidBarcode"
          : cardsExhausted
          ? "noGiftCard"
          : APIError
          ? "APIError"
          : "giftCard"
        : "offline"
      : "noGiftCard";

    return (
      <View>
        <Fragment>
          <Text content={t(thankYouText)} />
          <Divider style={styles.divider} />
          {!!completed48HoursAgo && (
            <Fragment>
              <Text
                style={styles.surveyTitle}
                content={t("SurveyLinkBlock:title")}
              />
              <Text content={t("takeSurveyAvailable")} />
              <Divider style={styles.divider} />
            </Fragment>
          )}

          {giftCardsAvailable && (
            <Fragment>
              <Text content={t(giftcardText, { giftCardAmount })} />
              {!cardsExhausted && isConnected && !invalidBarcode && !APIError && (
                <Fragment>
                  <Button
                    enabled={isConnected && !invalidBarcode && !cardsExhausted}
                    label={t("redeem")}
                    onPress={this._onRedeemPress}
                    primary={true}
                    style={styles.redeemButton}
                  />
                  <Text content={t("note")} italic={true} />
                  <Text
                    bold={true}
                    content={t("faqLink")}
                    onPress={this._navToFAQ}
                    style={styles.link}
                  />
                </Fragment>
              )}
              {((invalidBarcode && !cardsExhausted) ||
                (APIError && !cardsExhausted)) && (
                <Button
                  label={t("emailSupport")}
                  enabled={true}
                  onPress={emailSupport}
                  primary={true}
                  style={[styles.redeemButton, { marginBottom: 0 }]}
                />
              )}
              <Divider style={styles.divider} />
            </Fragment>
          )}
        </Fragment>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  divider: {
    marginTop: GUTTER,
  },
  link: {
    marginTop: GUTTER,
    color: SECONDARY_COLOR,
  },
  redeemButton: {
    marginVertical: GUTTER,
    alignSelf: "center",
    borderWidth: THICK_BORDER_WIDTH,
    borderColor: PRIMARY_COLOR,
    borderRadius: BORDER_RADIUS,
  },
  redeemText: {
    paddingHorizontal: GUTTER,
    paddingVertical: GUTTER / 2,
    color: PRIMARY_COLOR,
  },
  surveyTitle: {
    marginBottom: GUTTER,
  },
});

export default connect((state: StoreState) => ({
  completed48HoursAgo:
    (new Date().getTime() -
      new Date(state.survey.workflow.surveyCompletedAt!).getTime()) /
      1000 /
      60 /
      60 >
    48,
  barcode: state.survey.kitBarcode ? state.survey.kitBarcode.code : "",
  isConnected: state.meta.isConnected,
  isDemo: state.meta.isDemo,
  giftCardAmount: state.meta.giftCardAmount,
}))(withNavigation(withNamespaces("Giftcard")(GiftCard)));
