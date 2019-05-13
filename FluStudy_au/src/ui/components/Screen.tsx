// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { connect } from "react-redux";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { NavigationScreenProp } from "react-navigation";
import { ScrollIntoView, wrapScrollView } from "react-native-scroll-into-view";
import { Action, Option, StoreState } from "../../store";
import Barcode from "./flu/Barcode";
import Button from "./Button";
import Chrome from "./Chrome";
import Divider from "./Divider";
import MonthPicker from "./MonthPicker";
import OptionQuestion from "./OptionQuestion";
import QuestionText from "./QuestionText";
import RadioGrid from "./RadioGrid";
import BorderView from "./BorderView";
import ButtonGrid from "./ButtonGrid";
import MainImage from "./MainImage";
import Text from "./Text";
import Title from "./Title";
import VideoPlayer from "./VideoPlayer";
import ScreenImages from "./ScreenImages";
import { GUTTER, HIGHLIGHT_STYLE, SMALL_TEXT } from "../styles";
import { getRemoteConfig, overrideRemoteConfig } from "../../util/remoteConfig";
import { setShownOfflineWarning } from "../../store";
import { SurveyQuestionData } from "../../resources/ScreenConfig";

interface Props {
  barcode?: boolean;
  buttonLabel?: string;
  cantProceed?: boolean;
  centerDesc?: boolean;
  children?: any;
  questions?: SurveyQuestionData[];
  desc?: string;
  disclaimer?: string;
  dispatch?(action: Action): void;
  extraText?: string;
  footer?: any;
  hasDivider?: boolean;
  hideBackButton?: boolean;
  hideQuestionText?: boolean;
  header?: any;
  images?: string[];
  image?: string;
  isConnected?: boolean;
  menuItem?: boolean;
  navigation: NavigationScreenProp<any, any>;
  shownOfflineWarning?: boolean;
  skipButton?: boolean;
  splashImage?: string;
  subTitle?: string;
  title?: string;
  videoId?: string;
  getAnswer?: (key: string, id: string) => string;
  updateAnswer?: (answer: object, data: SurveyQuestionData) => void;
  onTitlePress?: () => void;
  onNext?: () => void;
}

const CustomScrollView = wrapScrollView(ScrollView);

interface ScreenState {
  triedToProceed: boolean;
}

@connect((state: StoreState) => ({
  isConnected: state.meta.isConnected,
  shownOfflineWarning: state.meta.shownOfflineWarning,
}))
class Screen extends React.Component<Props & WithNamespaces, ScreenState> {
  requiredQuestions = {};

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { triedToProceed: false };
  }

  _handleNavigation = () => {
    const {
      dispatch,
      isConnected,
      onNext,
      shownOfflineWarning,
      t,
    } = this.props;

    if (!isConnected && !shownOfflineWarning) {
      dispatch!(setShownOfflineWarning(true));
      Alert.alert(
        t("common:notifications:connectionErrorTitle"),
        t("common:notifications:connectionError"),
        [{ text: "Try Again" }]
      );
    } else if (!!onNext) {
      onNext();
    }
  };

  _evaluateConditional(config: SurveyQuestionData): boolean {
    const { getAnswer } = this.props;
    return (
      !!config.condition &&
      !!getAnswer &&
      getAnswer(config.condition!.key, config.condition!.id) ===
        config.condition!.answer
    );
  }

  _validateQuestions = () => {
    if (this.props.questions == null) {
      !!this.props.onNext && this.props.onNext();
      return;
    }

    let firstRequired: any | null = null;

    Object.keys(this.requiredQuestions).forEach((questionId: string) => {
      const type = (this.requiredQuestions as any)[questionId].type;
      const hasAnswer = this._hasAnswer(questionId, type);

      if (!hasAnswer && firstRequired === null) {
        firstRequired = (this.requiredQuestions as any)[questionId].ref;
      }
    });

    if (!!firstRequired) {
      this.setState({ triedToProceed: true });
      (firstRequired as any).scrollIntoView();
    } else {
      this.setState({ triedToProceed: false });
      this._handleNavigation();
    }
  };

  _hasAnswer = (id: string, type: string) => {
    const { getAnswer } = this.props;
    switch (type) {
      case "optionQuestion":
        const options: Option[] | any = !!getAnswer
          ? getAnswer("options", id)
          : [];
        return options
          ? options.reduce(
              (result: boolean, option: Option) => result || option.selected,
              false
            )
          : false;
      case "radioGrid":
      case "buttonGrid":
        return !!getAnswer && getAnswer("selectedButtonKey", id) !== null;
      case "datePicker":
        return !!getAnswer && getAnswer("dateInput", id) !== null;
      default:
        return false;
    }
  };

  _renderQuestions = () => {
    const {
      hideQuestionText,
      questions,
      getAnswer,
      t,
      updateAnswer,
    } = this.props;
    if (!!questions && !!getAnswer && !!updateAnswer) {
      return questions.map((config, index) => {
        if (
          (!!config.condition && this._evaluateConditional(config)) ||
          !config.condition
        ) {
          let highlighted = false;

          if (config.required) {
            (this.requiredQuestions as any)[config.id] = {
              ref: React.createRef<View>(),
              type: config.type,
            };

            const hasAnswer = this._hasAnswer(config.id, config.type);

            if (this.state.triedToProceed && !hasAnswer) {
              highlighted = true;
            }
          }

          switch (config.type) {
            case "optionQuestion":
              return (
                <OptionQuestion
                  key={`${config.id}-${index}`}
                  question={config}
                  hideQuestionText={hideQuestionText}
                  highlighted={highlighted}
                  onRef={(ref: any) => {
                    if (config.required) {
                      (this.requiredQuestions as any)[config.id].ref = ref;
                    }
                  }}
                  getAnswer={getAnswer}
                  updateAnswer={updateAnswer}
                />
              );
            case "radioGrid":
              return (
                <RadioGrid
                  desc={!!config.description}
                  key={`${config.id}-${index}`}
                  hideQuestion={hideQuestionText}
                  highlighted={highlighted}
                  onRef={(ref: any) => {
                    if (config.required) {
                      (this.requiredQuestions as any)[config.id].ref = ref;
                    }
                  }}
                  question={config}
                  getAnswer={getAnswer}
                  updateAnswer={updateAnswer}
                />
              );
            case "buttonGrid":
              return (
                <ButtonGrid
                  key={`${config.id}-${index}`}
                  onRef={(ref: any) => {
                    if (config.required) {
                      (this.requiredQuestions as any)[config.id].ref = ref;
                    }
                  }}
                  question={config}
                  highlighted={highlighted}
                  getAnswer={getAnswer}
                  updateAnswer={updateAnswer}
                />
              );
            case "datePicker":
              const dateAnswer = getAnswer("dateInput", config.id);
              return (
                <ScrollIntoView
                  ref={
                    config.required &&
                    (this.requiredQuestions as any)[config.id].ref
                  }
                  style={!!highlighted && HIGHLIGHT_STYLE}
                  key={`${config.id}-${index}`}
                >
                  <QuestionText text={t("surveyTitle:" + config.title)} />
                  <MonthPicker
                    key={`${config.id}-${index}`}
                    date={
                      dateAnswer === null ? dateAnswer : new Date(dateAnswer)
                    }
                    startDate={config.startDate!}
                    endDate={new Date(Date.now())}
                    onDateChange={(dateInput: Date | null) => {
                      updateAnswer({ dateInput }, config);
                    }}
                  />
                </ScrollIntoView>
              );
            default:
              break;
          }
        }
      });
    } else {
      return <View />;
    }
  };

  render() {
    const {
      desc,
      cantProceed,
      centerDesc,
      barcode,
      buttonLabel,
      children,
      disclaimer,
      extraText,
      footer,
      hasDivider,
      header,
      hideBackButton,
      images,
      image,
      menuItem,
      navigation,
      onTitlePress,
      skipButton,
      splashImage,
      subTitle,
      t,
      title,
      videoId,
    } = this.props;
    return (
      <Chrome
        hideBackButton={hideBackButton}
        menuItem={menuItem}
        navigation={navigation}
        splashImage={splashImage}
      >
        <View style={styles.scrollContainer}>
          <CustomScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContainer}>
              {!!image && <MainImage menuItem={menuItem} uri={image} />}
              {!!subTitle && (
                <View style={{ paddingHorizontal: GUTTER * 2 }}>
                  <Divider style={{ marginVertical: GUTTER / 2 }} />
                  <Text style={{ alignSelf: "center" }} content={subTitle} />
                  <Divider style={{ marginVertical: GUTTER / 2 }} />
                </View>
              )}
              {!!title && <Title label={title} onPress={onTitlePress} />}
              {!!barcode && <Barcode />}
              {!!desc && (
                <Text
                  content={desc}
                  center={!!centerDesc}
                  style={{
                    alignSelf: "stretch",
                    marginBottom: GUTTER,
                  }}
                />
              )}
              {!!hasDivider && <Divider />}
              {!!header && header}
              {!!images && <ScreenImages images={images} />}
              {this._renderQuestions()}
              {children}
              {!!extraText && (
                <Text content={extraText} style={{ marginBottom: GUTTER }} />
              )}
              {videoId != null && <VideoPlayer id={videoId} />}
            </View>
            <View style={styles.footerContainer}>
              {!!disclaimer && (
                <Text content={disclaimer} style={styles.disclaimer} />
              )}
              {!skipButton && (
                <Button
                  enabled={!cantProceed}
                  label={
                    buttonLabel != null
                      ? buttonLabel
                      : t("common:button:continue")
                  }
                  primary={true}
                  onPress={this._validateQuestions}
                />
              )}
              {footer}
            </View>
          </CustomScrollView>
        </View>
      </Chrome>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: GUTTER / 2,
  },
  disclaimer: {
    alignSelf: "stretch",
    fontSize: SMALL_TEXT,
    marginBottom: GUTTER,
  },
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: GUTTER,
  },
  innerContainer: {
    marginHorizontal: GUTTER,
    flex: 1,
  },
  scrollContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
});

export default withNamespaces()(Screen);
