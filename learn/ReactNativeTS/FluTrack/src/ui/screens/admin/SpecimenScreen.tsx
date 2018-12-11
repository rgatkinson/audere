import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { Alert, StyleSheet, Text, View } from "react-native";
import { connect } from "react-redux";
import {
  Action,
  Sample,
  StoreState,
  setSamples,
} from "../../../store";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import { BarCodeScanner, Permissions } from 'expo';

interface Props {
  dispatch(action: Action): void;
  name: string;
  navigation: NavigationScreenProp<any, any>;
  samples: Sample[];
}

@connect((state: StoreState) => ({
  name: state.form.name,
  samples: state.form.samples,
}))
export default class SpecimentScreen extends React.Component<Props> {
  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<any, any>}) => {
    const { params = null } = navigation.state;
    return {
      title: "Specimen Scan",
      headerRight: (!!params ?
        <FeedbackButton onPress={params.showFeedback} />
        : null
      ),
    };
  };

  state = {
    activeScan: false,
    feedbackVisible: false,
    hasCameraPermission: null,
  };

  async componentDidMount() {
    this.props.navigation.setParams({
      showFeedback: () => this.setState({ feedbackVisible: true }),
    });
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  handleBarCodeScanned = (
    { type, data }: { type: any, data: string }
  ) => {
    const samples = !!this.props.samples ? this.props.samples.slice(0) : [];
    samples.push({ sampleType: type.toString(), code: data });
    Alert.alert(
      "Submit?",
      `Bar code with type ${type} and data ${data} will be recorded for ${this.props.name}.`,
      [
        {
          text: "Cancel",
          onPress: () => {
            this.setState({ activeScan: false });
          },
        },
        {
          text: "OK",
          onPress: () => {
            this.setState({ activeScan: false });
            this.props.dispatch(setSamples(samples));
            this.props.navigation.popToTop();
          },
        },
      ]
    );
  }

  render() {
    const { hasCameraPermission } = this.state;

    return (
      <View style={styles.container}>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        <BarCodeScanner
          onBarCodeScanned={({ type, data }: { type: any, data: string }) => {
            if (!this.state.activeScan) {
              this.setState({ activeScan: true });
              this.handleBarCodeScanned({ type, data });
            }
          }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  }
});
