import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import {
  Action,
  StoreState,
  setLocation,
  setLocationType,
} from "../../../store";
import FeedbackButton from "../../components/FeedbackButton";
import FeedbackModal from "../../components/FeedbackModal";
import OptionList from "../../components/OptionList";
import ScreenContainer from "../../components/ScreenContainer";

import {
  COLLECTION_LOCATIONS,
  getLocationType,
} from "../../../resources/LocationConfig";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  location: string;
  dispatch(action: Action): void;
  screenProps: any;
}

@connect((state: StoreState) => ({
  location: state.admin.location,
}))
export default class SelectLocationScreen extends React.Component<Props> {
  static navigationOptions = ({ navigation }: { navigation: NavigationScreenProp<any, any>}) => {
    const { params = null } = navigation.state;
    return {
      title: "Select Location",
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

  _getLocations(selectedLocation: string): Map<string, boolean> {
    let locations = new Map<string, boolean>();
    Object.keys(COLLECTION_LOCATIONS).map((location: string) =>
      locations.set(location, false)
    );
    if (!!selectedLocation) {
      locations.set(selectedLocation, true);
    }
    return locations;
  }

  render() {
    return (
      <ScreenContainer>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        <OptionList
          data={this._getLocations(this.props.location)}
          numColumns={1}
          multiSelect={false}
          fullWidth={true}
          backgroundColor="#fff"
          onChange={data => {
            for (const location of data.keys()) {
              if (data.get(location)) {
                this.props.dispatch(setLocation(location));
                this.props.dispatch(setLocationType(getLocationType(location)));
                break;
              }
            }
          }}
        />
      </ScreenContainer>
    );
  }
}
