import React from "react";
import { Picker, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";

interface Props {
  state: string;
  visible: boolean;
  onDismiss(state: string): void;
}

interface State {
  state: string | null;
}

const states = [
  "AK",
  "AL",
  "AR",
  "AZ",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "IA",
  "ID",
  "IL",
  "IN",
  "KS",
  "KY",
  "LA",
  "MA",
  "MD",
  "ME",
  "MI",
  "MN",
  "MO",
  "MS",
  "MT",
  "NC",
  "ND",
  "NE",
  "NH",
  "NJ",
  "NM",
  "NV",
  "NY",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WI",
  "WV",
  "WY",
  "AS",
  "DC",
  "FM",
  "GU",
  "MH",
  "MP",
  "PW",
  "PR",
  "VI",
];

class StateModal extends React.Component<Props & WithNamespaces, State> {
  state = {
    state: null,
  };

  _getState = (): string => {
    if (this.state.state != null) {
      return this.state.state!;
    }
    return this.props.state;
  };

  render() {
    const { t } = this.props;
    return (
      <Modal
        height={280}
        width={350}
        submitText={t("common:button:done")}
        visible={this.props.visible}
        onDismiss={() => this.props.onDismiss(this.props.state)}
        onSubmit={() => this.props.onDismiss(this._getState())}
      >
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={this._getState()}
            style={{ height: 50, width: 100 }}
            onValueChange={(state: string) => this.setState({ state })}
          >
            {states.map((state: string) => (
              <Picker.Item label={state} value={state} key={state} />
            ))}
          </Picker>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  pickerContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
});

export default withNamespaces()(StateModal);
