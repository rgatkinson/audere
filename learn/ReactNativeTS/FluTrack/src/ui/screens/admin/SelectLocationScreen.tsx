import React from "react";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { StoreState } from "../../../store/index";
import { Action, setLocation } from "../../../store";
import OptionList from "../experiment/components/OptionList";
import ScreenContainer from "../experiment/components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  location: string;
  dispatch(action: Action): void;
  screenProps: any;
}

const COLLECTION_LOCATIONS: {
  [key: string]: { category: string; locations: string[] };
} = {
  // TODO: Let's read this out of a DB not hardcode
  // Should dynamically read in locations if not categories
  clinic: {
    category: "Clinics",
    locations: [
      "University of Washington",
      "Harborview",
      "Northwest Hospital",
      "Seattle Children's",
      "Fred Hutch",
      "UW Fremont Clinic",
    ],
  },
  communityClinic: {
    category: "Clinical Sites",
    locations: ["Seamar So. King County", "UW Healthcare Equity"],
  },
  childcare: {
    category: "Childcare Facilities",
    locations: ["Hutch Kids", "UW Daycare"],
  },
  homeless: {
    category: "Homeless Shelters",
    locations: ["Health Care for the Homeless", "King County Public Health"],
  },
  pharmacy: {
    category: "Pharmacies",
    locations: ["Bartell", "Walgreens"],
  },
  port: {
    category: "International Ports",
    locations: [
      "Domestic Arrivals (SeaTac)",
      "Alaska Cruises",
      "International Arrivals (CDC)",
      "Alaska Airlines",
    ],
  },
  workplace: {
    category: "Workplaces",
    locations: ["Boeing", "Microsoft", "Amazon", "Other"],
  },
};

@connect((state: StoreState) => ({
  location: state.admin == null ? null : state.admin.location,
}))
export default class SelectLocationScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Select Location",
  };
  _getLocations(selectedLocation: string): Map<string, boolean> {
    let locations = new Map<string, boolean>();
    Object.keys(COLLECTION_LOCATIONS).map((cat: string) =>
      COLLECTION_LOCATIONS[cat].locations.forEach((loc: string) =>
        locations.set(COLLECTION_LOCATIONS[cat].category + " - " + loc, false)
      )
    );
    locations.set(selectedLocation, true);
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
            for (const key of data.keys()) {
              if (data.get(key)) {
                this.props.dispatch(setLocation(key));
                break;
              }
            }
          }}
        />
      </ScreenContainer>
    );
  }
}
