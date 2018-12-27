import React from "react";
import { Picker, StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Modal from "./Modal";

interface Props {
  min: number;
  max: number;
  maxPlus: boolean;
  num?: number;
  visible: boolean;
  onDismiss(num?: number): void;
}

interface State {
  num: number;
  setNum: boolean;
}

class NumberSelectorModal extends React.Component<Props & WithNamespaces, State> {
  state = {
    num: -1,
    setNum: false,
  };

  _getNum = (): number => {
    if (this.state.setNum) {
      return this.state.num;
    } else if (this.props.num != null) {
      return this.props.num;
    } else {
      return this.props.min;
    }
  };

  render() {
    const { t } = this.props;
    const range = Array(this.props.max - this.props.min + 1).fill(0).map((item: any, index: number) => {
      return this.props.min + index;
    });
    const maxPlus = this.props.max + "+";
    return (
      <Modal
        height={280}
        width={350}
        submitText={t("common:button:done")}
        visible={this.props.visible}
        onDismiss={() => this.props.onDismiss(this.props.num)}
        onSubmit={() => this.props.onDismiss(this._getNum())}
      >
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={this._getNum()}
            style={{ height: 50, width: 100 }}
            onValueChange={num => this.setState({ num, setNum: true })}>
            {range.map((num: number) => <Picker.Item label={"" + num} value={num} key={num} />)}
            {this.props.maxPlus && <Picker.Item label={maxPlus} value={maxPlus} key={maxPlus} />}
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

export default withNamespaces("numberSelectorModal")(NumberSelectorModal);
