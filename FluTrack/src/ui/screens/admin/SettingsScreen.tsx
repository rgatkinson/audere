// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Constants } from "expo";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import axios from "axios";
import { getApiBaseUrl } from "../../../transport";
import { FormState, StoreState } from "../../../store";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { AgeBuckets, AgeBucketConfig } from "../../../resources/ScreenConfig";
import { uploader } from "../../../store/uploader";
import Button from "../../components/Button";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import EditSettingButton from "../../components/EditSettingButton";
import ScreenContainer from "../../components/ScreenContainer";
import Text from "../../components/Text";
import { syncToCouch } from "../../../transport/index";
import { getDeviceSetting } from "../../../util/deviceSettings";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  form: FormState;
}

@connect((state: StoreState) => ({
  form: state.form,
}))
class SettingsScreen extends React.Component<Props & ReduxWriterProps> {
  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<any, any>;
  }) => {
    const { params = null } = navigation.state;
    return {
      title: "Admin Settings",
      headerRight: !!params ? (
        <FeedbackButton onPress={params.showFeedback} />
      ) : null,
    };
  };

  state = {
    feedbackVisible: false,
    documentsAwaitingUpload: -1,
    refreshMessage: "",
  };

  async _loadNumDocs() {
    const numDocs = await uploader.documentsAwaitingUpload();
    if (numDocs != null) {
      this.setState({ documentsAwaitingUpload: numDocs });
    }
  }

  async _refresh() {
    this._loadNumDocs();

    const address = await getDeviceSetting("COUCH_DB_SYNC");
    if (!address) {
      return;
    }
    try {
      this.setState({ refreshMessage: `Syncing to ${address}...` });
      await syncToCouch(address);
      this.setState({ refreshMessage: `Synced to ${address}` });
    } catch (e) {
      this.setState({ refreshMessage: `Failed to sync to ${address}` });
      console.log(e);
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
    this._loadNumDocs();
  }

  _onPrior = () => {
    this.props.navigation.push("Prior");
  };

  _hasValidConsent = () => {
    const ageBucket = this.props.getAnswer(
      "selectedButtonKey",
      AgeBucketConfig.id
    );
    if (ageBucket === AgeBuckets.Over18) {
      return !!this.props.form.consent;
    } else if (ageBucket === AgeBuckets.Teen) {
      return !!this.props.form.consent && !!this.props.form.parentConsent;
    } else if (ageBucket === AgeBuckets.Child) {
      return !!this.props.form.parentConsent && !!this.props.form.assent;
    } else {
      // under7
      return !!this.props.form.parentConsent;
    }
  };

  _onAdverseEvents = () => {
    if (this._hasValidConsent() && !this.props.form.completedSurvey) {
      this.props.navigation.push("Adverse");
    } else {
      Alert.alert(
        "There is no active consented participant. Please have a participant complete the survey first."
      );
    }
  };

  _onSpecimenScans = () => {
    if (this._hasValidConsent() && !this.props.form.completedSurvey) {
      this.props.navigation.push("Specimen");
    } else {
      Alert.alert(
        "There is no active consented participant. Please have a participant complete the survey first."
      );
    }
  };

  _onGiftCardScan = () => {
    if (this._hasValidConsent() && !this.props.form.completedSurvey) {
      this.props.navigation.push("GiftCardType");
    } else {
      Alert.alert(
        "There is no active consented participant. Please have a participant complete the survey first."
      );
    }
  };

  _getParticipantInfo = () => {
    if (this._hasValidConsent() && !this.props.form.completedSurvey) {
      const numSpecimens = !!this.props.form.samples
        ? this.props.form.samples.length
        : 0;
      const numGiftCards = !!this.props.form.giftcards
        ? this.props.form.giftcards.length
        : 0;
      const specimensPlural = numSpecimens == 1 ? "" : "s";
      const giftCardsPlural = numGiftCards == 1 ? "" : "s";
      return ` (${this.props.form.name}: ${numSpecimens} specimen${specimensPlural}, ${numGiftCards} gift card${giftCardsPlural})`;
    } else {
      return "";
    }
  };

  render() {
    return (
      <ScreenContainer>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        <View style={styles.descriptionContainer}>
          <Text
            center={true}
            content="These settings should be set by study administrators and staff only."
          />
        </View>
        <EditSettingButton
          label="Prior to Collection"
          onPress={this._onPrior}
        />
        <Text
          content={"Post Collection" + this._getParticipantInfo()}
          style={styles.sectionHeaderText}
        />
        <EditSettingButton
          label="Adverse Events"
          onPress={this._onAdverseEvents}
        />
        <EditSettingButton
          label="Specimen Scan"
          onPress={this._onSpecimenScans}
        />
        <EditSettingButton
          label="Gift Card Scan"
          onPress={this._onGiftCardScan}
        />
        <View style={styles.syncContainer}>
          <Text
            center={true}
            content={`Surveys or logs waiting to be synced: ${
              this.state.documentsAwaitingUpload == -1
                ? "..."
                : this.state.documentsAwaitingUpload
            }`}
          />
          <Button
            enabled={true}
            label="Refresh"
            primary={true}
            style={{ width: 200, marginVertical: 0 }}
            onPress={() => this._refresh()}
          />
          <Text center={true} content={this.state.refreshMessage} />
        </View>
        <View style={styles.supportContainer}>
          <Text
            center={true}
            content="For technical support in using this app, contact Audere Support at support@auderenow.org."
          />
        </View>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  descriptionContainer: {
    marginBottom: 40,
    marginHorizontal: 15,
    marginTop: 25,
  },
  sectionHeaderText: {
    marginBottom: 7,
    marginLeft: 15,
    marginTop: 40,
  },
  supportContainer: {
    marginHorizontal: 15,
    marginTop: 50,
  },
  syncContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    padding: 15,
  },
});

export default reduxWriter(SettingsScreen);
