import React from "react";
import { StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import TabMenu from "./components/TabMenu";
import { TitlebarCallback } from "./AppController";
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
  EBOLA_POSITIVE_COLOR,
  EBOLA_NEGATIVE_COLOR,
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
  setupTitlebarInfo(s: Screen, info: TitlebarCallback): void;
}

interface State {
  selectedIndex: number;
}

class PatientDetails extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    const { t } = this.props;
    this.props.setupTitlebarInfo(Screen.PatientDetails, {
      onBack: this._navToList,
      getTitlebarText: this._getTitlebarText,
    });

    this.state = {
      selectedIndex: this.props.selectedIndex || 0,
    };
  }

  _getTitlebarText = () => {
    const { isNew, t } = this.props;
    if (isNew) {
      return t("details:titlebarText");
    } else {
      const { firstName, lastName } = this.props.patientInfo;
      return firstName.length > 0 ? firstName + " " + lastName : lastName;
    }
  };

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
                    ? EBOLA_POSITIVE_COLOR
                    : EBOLA_NEGATIVE_COLOR,
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
  patientInfo:
    props.id < state.patients.length
      ? state.patients[props.id].patientInfo
      : {
          firstName: "",
          lastName: "",
          phone: "",
          details: "",
          notes: "",
        },
}))(withNamespaces("patientDetails")(PatientDetails));
