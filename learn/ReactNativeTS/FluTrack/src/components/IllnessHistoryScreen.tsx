import React from "react";
import { View } from "react-native";
import StyledButton from "./StyledButton";
import FieldLabel from "./FieldLabel";
import RadioButton from "./RadioButton";
import ScreenView from "./ScreenView";
import ValidatedInput from "./ValidatedInput";
import MyText from "./MyText";
import { NavigationScreenProp } from "react-navigation";
import { interact } from "../../App";
import styles from "../Styles";

interface Props {
  navigation: NavigationScreenProp<any, any>;
  onNext: string;
}
export default class IllnessHistoryScreen extends React.Component<Props, any> {
  state = {
    currentlyHospitalized: false,
  };
  render() {
    return (
      <ScreenView>
        <MyText size="heading">Illness History</MyText>
        <View style={styles.formLayout}>
          <MyText>Including today, how many days have you been sick?</MyText>
          <FieldLabel label="">
            <ValidatedInput
              inputType="nonNegativeInteger"
              autoFocus={true}
              onChangeText={daysSick => this.setState({ daysSick })}
            />
          </FieldLabel>
          <MyText>Currently hospitalized</MyText>
          <FieldLabel label="">
            <RadioButton
              initial={1}
              onPress={currentlyHospitalized => {
                this.setState({ currentlyHospitalized });
              }}
            />
          </FieldLabel>
          {this.state.currentlyHospitalized && (
            <View>
              <MyText>Length of hospitalization (days):</MyText>
              <FieldLabel label="">
                <ValidatedInput
                  inputType="nonNegativeInteger"
                  autoFocus={true}
                  onChangeText={daysHospitalized =>
                    this.setState({ daysHospitalized })
                  }
                />
              </FieldLabel>
            </View>
          )}
        </View>
        <StyledButton
          title="NEXT"
          onPress={() => {
            interact(JSON.stringify(this.state));
            this.props.navigation.navigate(this.props.onNext);
          }}
        />
      </ScreenView>
    );
  }
}
