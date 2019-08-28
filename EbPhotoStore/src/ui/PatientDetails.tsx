import React from "react";
import { StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import TabMenu from "./components/TabMenu";
import { BackCallback } from "./AppController";
import {
  Action,
  Screen,
  viewPatients,
  StoreState,
  saveSelectedTab,
} from "../store";
import Details from "./Details";
import Messages from "./Messages";
import Tests from "./Tests";
import Text from "./components/Text";
import { withNamespaces, WithNamespaces } from "react-i18next";
import { PatientInfo, AuthUser } from "audere-lib/ebPhotoStoreProtocol";
import {
  GUTTER,
  EVD_POSITIVE_COLOR,
  EVD_NEGATIVE_COLOR,
  TITLEBAR_COLOR,
  EXTRA_SMALL_TEXT,
} from "./styles";

interface Props {
  diagnosisInfo?:
    | {
        diagnoser: AuthUser;
        timestamp: string;
      }
    | undefined;
  dispatch(action: Action): void;
  evdPositive?: boolean;
  id: number;
  isNew: boolean;
  notes?: string;
  patientInfo: PatientInfo;
  selectedIndex: number;
  setupBackInfo(s: Screen, info: BackCallback): void;
}

interface State {
  selectedIndex: number;
}

class PatientDetails extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    const { t } = this.props;
    this.props.setupBackInfo(Screen.PatientDetails, {
      onBack: this._navToList,
      backText: t("common:navigation:list"),
    });

    this.state = {
      selectedIndex: this.props.selectedIndex || 0,
    };
  }

  _navToList = () => {
    this.props.dispatch(viewPatients());
  };

  _onMenuChange = (selectedIndex: number) => {
    this.setState({ selectedIndex });
  };

  componentWillUnmount() {
    this.props.dispatch(saveSelectedTab(this.state.selectedIndex));
  }

  render() {
    const { selectedIndex } = this.state;
    const { diagnosisInfo, evdPositive, t } = this.props;

    return (
      <View style={styles.container}>
        {evdPositive !== undefined && (
          <View style={styles.diagnosisInfo}>
            <Text
              content={!!evdPositive ? t("evdPositive") : t("evdNegative")}
              style={[
                styles.evdCommon,
                {
                  color: !!evdPositive
                    ? EVD_POSITIVE_COLOR
                    : EVD_NEGATIVE_COLOR,
                },
              ]}
            />
            {diagnosisInfo !== undefined && (
              <Text
                content={t("reviewedBy", {
                  name: diagnosisInfo.diagnoser.name,
                  date: t("common:date", {
                    date: new Date(diagnosisInfo.timestamp),
                  }),
                })}
                style={styles.diagnosisInfo}
              />
            )}
          </View>
        )}
        <TabMenu
          selectedIndex={selectedIndex}
          onSelect={this._onMenuChange}
          tabs={[
            { label: "DETAILS", iconUri: "tabdetails" },
            { label: "TESTS", iconUri: "tabtests" },
            { label: "MESSAGES", iconUri: "tabmessages" },
          ]}
        >
          <Details editable={true} toggleable={true} id={this.props.id} />
          <Tests id={this.props.id} />
          <Messages id={this.props.id} />
        </TabMenu>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  diagnosisInfo: {
    fontSize: EXTRA_SMALL_TEXT,
    backgroundColor: TITLEBAR_COLOR,
    paddingHorizontal: GUTTER,
  },
  evdCommon: {
    fontWeight: "bold",
    lineHeight: undefined,
    marginHorizontal: GUTTER,
    marginVertical: GUTTER / 2,
  },
});

export default connect((state: StoreState, props: Props) => ({
  isNew: props.id === state.patients.length,
  selectedIndex: state.meta.selectedTab,
  diagnosisInfo:
    props.id < state.patients.length
      ? state.patients[props.id].diagnosisInfo
      : undefined,
  // TODO(ram): derive evdPositive from diagnoses collection instead of evdPositive
  evdPositive:
    props.id < state.patients.length
      ? state.patients[props.id].evdPositive
      : undefined,
}))(withNamespaces("patientDetails")(PatientDetails));
