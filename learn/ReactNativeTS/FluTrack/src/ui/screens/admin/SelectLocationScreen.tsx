import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import {
  Action,
  StoreState,
  setLocation,
  setLocationType,
} from "../../../store";
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
  location: state.admin == null ? null : state.admin.location,
}))
export default class SelectLocationScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Select Location",
  };

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
