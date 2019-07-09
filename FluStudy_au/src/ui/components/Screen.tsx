// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { ComponentType, RefObject } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import i18n from "i18next";
import { wrapScrollView } from "react-native-scroll-into-view";
import { WorkflowInfo } from "audere-lib/feverProtocol";
import { Action, StoreState, setWorkflow } from "../../store";
import { logFirebaseEvent } from "../../util/tracker";
import Chrome from "./Chrome";
import AnimatedChrome from "./AnimatedChrome";
import { SCREEN_MARGIN } from "../styles";

import { PubSubToken, PubSubHub, PubSubEvents } from "../../util/pubsub";
import { getRemoteConfig } from "../../util/remoteConfig";

export interface ScreenConfig {
  body: Component[];
  chromeProps?: ChromeProps;
  footer?: Component[];
  funnelEvent?: string;
  key: string;
  workflowEvent?: string;
  automationNext?: string;
  allowedRemoteConfigValues?: string[];
}

interface ComponentProps {
  next?: string;
  [key: string]: any;
}

export interface Component {
  tag: ComponentType<any>;
  props?: ComponentProps;
  validate?: boolean;
}

export interface ChromeProps {
  dispatchOnFirstLoad?: () => Action;
  fadeIn?: boolean;
  hideBackButton?: boolean;
  menuItem?: boolean;
  splashImage?: string;
}

interface Props {
  dispatch(action: Action): void;
  hasBeenOpened: boolean;
  isDemo: boolean;
  navigation: NavigationScreenProp<any, any>;
  workflow: WorkflowInfo;
}

// Whether we've reached the screen we wanted to auto-forward to.  Having this
// makes it so that once you've reached the screen, you can nav backward without
// the app auto-forwarding you again.
let _reachedAutoForwardToScreen = false;

const CustomScrollView = wrapScrollView(ScrollView);

export const generateScreen = (config: ScreenConfig) => {
  class Screen extends React.Component<Props> {
    static navigationOptions = () => {
      return {
        title: i18n.t(config.key + ":title"),
      };
    };

    _toValidate: Map<string, RefObject<any>>;
    _noRendering: boolean;
    _titlePressToken: PubSubToken;
    _remoteConfigValues?: { [key: string]: string };

    constructor(props: Props) {
      super(props);
      this._toValidate = new Map<string, RefObject<any>>();
      config.body.map((component, index) => {
        if (component.validate) {
          this._toValidate.set("body" + index, React.createRef<any>());
        }
      });
      config.allowedRemoteConfigValues &&
        config.allowedRemoteConfigValues.map(key => {
          if (this._remoteConfigValues === undefined) {
            this._remoteConfigValues = {};
          }
          this._remoteConfigValues[key] = getRemoteConfig(key);
        });
      this._noRendering = true;
    }

    componentDidMount() {
      if (config.funnelEvent) {
        logFirebaseEvent(config.funnelEvent);
      }
      if (config.workflowEvent && !this.props.workflow[config.workflowEvent]) {
        const workflow = { ...this.props.workflow };
        workflow[config.workflowEvent] = new Date().toISOString();
        this.props.dispatch(setWorkflow(workflow));
      }

      // Prevent screen rendering when not focused, and allow screen rendering when
      // focused. We use willFocus so the screen renders during incoming transitions,
      // and didBlur so the screen stops rendering after outgoing transitions.
      //
      // If we simply used isFocused then the screen would be blank during
      // transitions, since that property is effectively true after didFocus and false
      // after willBlur.
      //
      // Note a side-effect of this optimization is that willFocus will not fire for
      // components that are contained by the screen since they'll only get rendered
      // *after* the willFocus of the screen fires, and that event isn't propagated after
      // the fact.
      //
      // We also include didFocus to check rendering state for the case where a screen
      // gets navigated to during another view's transition to focused state - this won't
      // fire a willFocus event. This is rare but achievable if a user quickly navigates
      // away during a transition.
      //
      this.props.navigation.addListener("willFocus", this._handleFocus);
      this.props.navigation.addListener("didFocus", this._handleFocus);
      this.props.navigation.addListener("didBlur", () => {
        this._noRendering = true;
        this._unsubscribeTitlePress();
      });
    }

    _unsubscribeTitlePress() {
      if (this._titlePressToken) {
        PubSubHub.unsubscribe(this._titlePressToken);
        this._titlePressToken = null;
      }
    }

    _handleFocus = () => {
      if (this._noRendering) {
        this._noRendering = false;
        this.forceUpdate();

        this._unsubscribeTitlePress();
        if (this.props.isDemo && process.env.NODE_ENV === "development") {
          if (process.env.AUTO_FORWARD_TO_SCREEN) {
            if (process.env.AUTO_FORWARD_TO_SCREEN === config.key) {
              _reachedAutoForwardToScreen = true;
            } else if (!_reachedAutoForwardToScreen) {
              // 200ms is arbitrary.  Note that you can't just call
              // _advance directly, because you then start in a navigation.push
              // loop where you're not fully out of one push before you get
              // into another, at which point willFocus/didFocus listeners don't
              // get called correctly.  And 200 gives you a fighting chance of
              // seeing the screens fly by.
              setTimeout(this._advanceToNextScreen, 200);
            }
          } else {
            this._titlePressToken = PubSubHub.subscribe(
              PubSubEvents.TITLE_PRESSED,
              this._advanceToNextScreen
            );
          }
        }
      }
    };

    _findNextScreen(): string | undefined {
      if (config.automationNext) {
        return config.automationNext;
      } else if (config.footer) {
        const nextComponent = config.footer.find(
          component => !!(component.props && component.props.next)
        );

        if (nextComponent) {
          return nextComponent.props!.next;
        }
      }
      return undefined;
    }

    _advanceToNextScreen = () => {
      const nextScreen = this._findNextScreen();
      if (nextScreen) {
        this.props.navigation.push(nextScreen);
      }
    };

    _generateComponents = (
      components: Component[],
      indexId: string,
      screenKey: string
    ) => {
      return components.map((component, index) => {
        const Tag = component.tag;
        return (
          <Tag
            {...component.props}
            customRef={this._toValidate.get(indexId + index)}
            key={indexId + index}
            namespace={screenKey}
            validate={this._validateComponents}
            remoteConfigValues={this._remoteConfigValues}
          />
        );
      });
    };

    _validateComponents = () => {
      return Array.from(this._toValidate.values()).reduce(
        (result, ref) => result && ref.current!.validate(),
        true
      );
    };

    render() {
      const ChromeType =
        !!config && !!config.chromeProps && !!config.chromeProps.fadeIn
          ? AnimatedChrome
          : Chrome;

      return this._noRendering ? null : (
        <ChromeType
          {...config.chromeProps}
          hasBeenOpened={this.props.hasBeenOpened}
          navigation={this.props.navigation}
        >
          <View style={styles.scrollContainer}>
            <CustomScrollView
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.innerContainer}>
                {this._generateComponents(config.body, "body", config.key)}
              </View>
              <View style={styles.footerContainer}>
                {config.footer &&
                  this._generateComponents(config.footer, "footer", config.key)}
              </View>
            </CustomScrollView>
          </View>
        </ChromeType>
      );
    }
  }
  return connect((state: StoreState) => {
    return {
      workflow: state.survey.workflow,
      isDemo: state.meta.isDemo,
      hasBeenOpened: state.meta.hasBeenOpened,
    };
  })(Screen);
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: SCREEN_MARGIN,
  },
  innerContainer: {
    marginHorizontal: SCREEN_MARGIN,
    flex: 1,
  },
  scrollContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
});
