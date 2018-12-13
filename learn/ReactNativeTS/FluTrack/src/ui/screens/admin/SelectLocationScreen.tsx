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
import OptionList, { newSelectedOptionsList } from "../../components/OptionList";
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

  _getSelectedOptions = () => {
    const list = newSelectedOptionsList(Object.keys(COLLECTION_LOCATIONS));
    return list.map((location) => {
      return {
        key: location.key,
        selected: location.key === this.props.location,
      };
    });
  };

  render() {
    return (
      <ScreenContainer>
        <FeedbackModal
          visible={this.state.feedbackVisible}
          onDismiss={() => this.setState({ feedbackVisible: false })}
        />
        <OptionList
          data={this._getSelectedOptions()}
          numColumns={1}
          multiSelect={false}
          fullWidth={true}
          backgroundColor="#fff"
          onChange={data => {
            const location = data.find(option => option.selected);
            if (!!location) {
              this.props.dispatch(setLocation(location.key));
              this.props.dispatch(setLocationType(getLocationType(location.key)));
            }
          }}
        />
      </ScreenContainer>
    );
  }
}
