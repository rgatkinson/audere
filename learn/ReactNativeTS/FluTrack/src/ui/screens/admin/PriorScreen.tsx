import React from "react";
import { NavigationScreenProp } from "react-navigation";
import DropdownPicker from "./components/DropdownPicker";
import { View, Text, StyleSheet, Picker, Button } from "react-native";
import ScreenContainer from "../experiment/components/ScreenContainer";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  screenProps: any;
}

const COLLECTION_LOCATIONS = {
  // Should read this out of a DB so we don't have to change code when we add one
  clinic: {
    category: "Clinics",
    locations: ["University of Washington", "Northwest Hospital, Harborview"], //etc
  },
  communityClinic: {
    category: "Community Clinics",
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
    locations: ["Domestic Arrivals (SeaTac)", "Alaska Cruises"], //etc
  },
  workplace: {
    category: "Workplaces",
    locations: ["Boeing", "Microsoft"],
  },
};

export default class PriorScreen extends React.Component<Props> {
  static navigationOptions = {
    title: "Prior to Collection",
  };
  state = {
    location: "Clinics",
    bloodCollection: false,
  };

  render() {
    return (
      <ScreenContainer>
        <Text style={styles.sectionHeaderText}>Collection Location</Text>
        {/* <Picker
          itemStyle={{ backgroundColor: "white" }}
          selectedValue={this.state.location}
          onValueChange={location => this.setState({ location })}
        >
          {Object.keys(COLLECTION_LOCATIONS).map(cat => (
            <Picker.Item
              key={cat}
              value={cat}
              label={COLLECTION_LOCATIONS[cat].category}
            />
          ))}
        </Picker> */}
        <DropdownPicker
          label={
            this.state.location === null || this.state.location === undefined
              ? "Select one"
              : this.state.location
          }
          options={Object.keys(COLLECTION_LOCATIONS)}
          onPress={(buttonIndex: number) => {
            console.log(buttonIndex);
          }}
        />
        <Text style={styles.descriptionText}>
          The site where this device is being used to facilitate sample
          collection
        </Text>
        <Text style={styles.sectionHeaderText}>Blood Collection</Text>
        <DropdownPicker
          label={this.state.bloodCollection ? "Available" : "Not Available"}
          options={["Not Available", "Available"]}
          onPress={(buttonIndex: number) => {
            if (buttonIndex === 0) {
              this.setState({ bloodCollection: false });
            } else {
              this.setState({ bloodCollection: true });
            }
          }}
        />
        <Text style={styles.descriptionText}>
          If blood sample collection is available at this site, then the option
          to contribute will be given to participants during enrollment.
        </Text>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  sectionHeaderText: {
    marginTop: 30,
    marginBottom: 6,
    marginLeft: 15,
    fontSize: 24,
  },
  descriptionText: {
    marginLeft: 15,
    fontSize: 17,
  },
});
