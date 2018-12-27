import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { FormState, StoreState } from "../../../store";
import reduxWriter, { ReduxWriterProps } from "../../../store/ReduxWriter";
import { AgeBucketConfig } from "../../../resources/ScreenConfig";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import Description from "../../components/Description";
import EditSettingButton from "../../components/EditSettingButton";
import ScreenContainer from "../../components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  form: FormState;
}

@connect((state: StoreState) => ({
  form: state.form,
}))
class SettingsScreen extends React.Component<Props & ReduxWriterProps> {
  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<any, any>}) => {
    const { params = null } = navigation.state;
    return {
      title: "Admin Settings",
      headerRight: (!!params ?
        <FeedbackButton onPress={params.showFeedback} />
        : null
      ),
    };
  };

  state = {
    feedbackVisible: false,
  };

  componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
  }

  _onPrior = () => {
    this.props.navigation.push("Prior");
  };

  _hasValidConsent = () => {
    const ageBucket = this.props.getAnswer("selectedButtonKey", AgeBucketConfig.id);
    if (ageBucket === "18orOver") {
      return !!this.props.form.consent;
    } else if (ageBucket === "13to17") {
      return !!this.props.form.consent && !!this.props.form.parentConsent;
    } else if (ageBucket === "7to12") {
      return !!this.props.form.parentConsent && !!this.props.form.assent;
    } else { // under7
      return !!this.props.form.parentConsent;
    }
  }

  _onAdverseEvents = () => {
    if (this._hasValidConsent() && !this.props.form.completedSurvey) {
      this.props.navigation.push("Adverse");
    } else {
      Alert.alert(
        "There is no active consented participant. Please have a participant complete the survey first.",
      );
    }
  };

  _onSpecimenScans = () => {
    if (this._hasValidConsent() && !this.props.form.completedSurvey) {
      this.props.navigation.push("Specimen");
    } else {
      Alert.alert(
        "There is no active consented participant. Please have a participant complete the survey first.",
      );
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
          <Description content="These settings should be set by study administrators and staff only." />
        </View>
        <EditSettingButton
          label="Prior to Collection"
          onPress={this._onPrior}
        />
        <Text style={styles.sectionHeaderText}>Post Collection</Text>
        <EditSettingButton
          label="Adverse Events"
          onPress={this._onAdverseEvents}
        />
        <EditSettingButton
          label="Specimen Scans"
          onPress={this._onSpecimenScans}
        />
        <View style={styles.supportContainer}>
          <Description content="For technical support in using this app, contact Audere Support at support@auderenow.org." />
        </View>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  descriptionContainer: {
    marginHorizontal: 15,
    marginTop: 25,
    marginBottom: 40,
  },
  sectionHeaderText: {
    marginTop: 35,
    marginBottom: 7,
    marginLeft: 15,
    fontSize: 24,
  },
  supportContainer: {
    marginTop: 50,
    marginHorizontal: 15,
  },
});

export default reduxWriter(SettingsScreen);
