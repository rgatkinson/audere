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
import { Action, Option, setDemo, StoreState } from "../../store";
import Button from "./Button";
import Chrome from "./Chrome";
import Divider from "./Divider";
import MonthPicker from "./MonthPicker";
import OptionQuestion from "./OptionQuestion";
import QuestionText from "./QuestionText";
import RadioGrid from "./RadioGrid";
import ButtonGrid from "./ButtonGrid";
import Text from "./Text";
import Title from "./Title";
import VideoPlayer from "./VideoPlayer";
import ScreenImages from "./ScreenImages";
import { ASPECT_RATIO, GUTTER, HIGHLIGHT_STYLE, IMAGE_WIDTH } from "../styles";
import { getRemoteConfig, overrideRemoteConfig } from "../../util/remoteConfig";
import { setShownOfflineWarning } from "../../store";
import { SurveyQuestionData } from "../../resources/ScreenConfig";
interface Props {
  buttonLabel?: string;
  canProceed: boolean;
  centerDesc?: boolean;
  children?: any;
  configs?: SurveyQuestionData[];
  desc?: string;
  dispatch?(action: Action): void;
  footer?: any;
  hasDivider?: boolean;
  hideBackButton?: boolean;
  header?: any;
  images?: string[];
  image?: string;
  isDemo?: boolean;
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
  dispatch?(action: Action): void;
  onTitlePress?: () => void;
  onBack?: () => void;
  onNext?: () => void;
}

const CustomScrollView = wrapScrollView(ScrollView);
const TRIPLE_PRESS_DELAY = 500;
const LONG_PRESS_DELAY_MS = 3 * 1000;

interface ScreenState {
  triedToProceed: boolean;
}

@connect((state: StoreState) => ({
  isConnected: state.meta.isConnected,
  isDemo: state.meta.isDemo,
  shownOfflineWarning: state.meta.shownOfflineWarning,
}))
class Screen extends React.Component<Props & WithNamespaces, ScreenState> {
  lastTap: number | null = null;
  requiredQuestions = {};
  secondLastTap: number | null = null;

  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { triedToProceed: false };
  }

  handleTripleTap = () => {
    const now = Date.now();
    if (
      this.lastTap != null &&
      this.secondLastTap != null &&
      now - this.secondLastTap! < TRIPLE_PRESS_DELAY &&
      this.props.menuItem
    ) {
      this.props.dispatch!(setDemo(!this.props.isDemo));
    } else {
      this.secondLastTap = this.lastTap;
      this.lastTap = now;
    }
  };

  handleLongPress = () => {
    if (!this.props.isDemo) {
      return;
    }
    const blockKitOrders = getRemoteConfig("blockKitOrders");
    overrideRemoteConfig("blockKitOrders", !blockKitOrders);
    alert(`blockKitOrders is now ${!blockKitOrders}`);
  };

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
    if (this.props.configs == null) {
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
    const { configs, getAnswer, t, updateAnswer } = this.props;
    if (!!configs && !!getAnswer && !!updateAnswer) {
      return configs.map((config, index) => {
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
                  key={`${config.id}-${index}`}
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
      canProceed,
      centerDesc,
      buttonLabel,
      children,
      footer,
      hasDivider,
      header,
      hideBackButton,
      images,
      image,
      isDemo,
      menuItem,
      navigation,
      onBack,
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
        isDemo={isDemo}
        menuItem={menuItem}
        navigation={navigation}
        splashImage={splashImage}
        onBack={onBack}
      >
        <View style={styles.scrollContainer}>
          <CustomScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContainer}>
              {!!image && (
                <TouchableWithoutFeedback
                  style={{ alignSelf: "stretch" }}
                  delayLongPress={LONG_PRESS_DELAY_MS}
                  onPress={this.handleTripleTap}
                  onLongPress={this.handleLongPress}
                >
                  <Image
                    style={[styles.image, menuItem && styles.menuImage]}
                    source={{ uri: image }}
                  />
                </TouchableWithoutFeedback>
              )}
              {!!subTitle && (
                <View style={{ paddingHorizontal: GUTTER * 2 }}>
                  <Divider style={{ marginVertical: GUTTER / 2 }} />
                  <Text style={{ alignSelf: "center" }} content={subTitle} />
                  <Divider style={{ marginVertical: GUTTER / 2 }} />
                </View>
              )}
              {!!title && <Title label={title} onPress={onTitlePress} />}
              {!!desc && (
                <Text
                  content={desc}
                  center={!!centerDesc}
                  style={{
                    alignSelf: "stretch",
                    marginTop: GUTTER / 2,
                    marginBottom: GUTTER,
                  }}
                />
              )}
              {!!hasDivider && <Divider />}
              {!!header && header}
              {!!images && <ScreenImages images={images} />}
              {this._renderQuestions()}
              {children}
              {videoId != null && <VideoPlayer id={videoId} />}
            </View>
            <View style={styles.footerContainer}>
              {!skipButton && (
                <Button
                  enabled={canProceed}
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
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: GUTTER,
  },
  image: {
    alignSelf: "center",
    aspectRatio: ASPECT_RATIO,
    height: undefined,
    marginVertical: GUTTER / 2,
    width: IMAGE_WIDTH,
  },
  innerContainer: {
    marginHorizontal: GUTTER,
    flex: 1,
  },
  menuImage: {
    aspectRatio: 4.23,
    width: "80%",
  },
  scrollContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
});

export default withNamespaces()(Screen);
