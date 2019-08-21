import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState } from "../../../store";
import BorderView from "../BorderView";
import Text from "../Text";

interface Props {
  barcode: string;
}

class Barcode extends React.Component<Props & WithNamespaces> {
  shouldComponentUpdate(props: Props & WithNamespaces) {
    return props.barcode != this.props.barcode;
  }

  render() {
    const { barcode, t } = this.props;
    return (
      <BorderView>
        <Text center={true} content={t("yourCode", { barcode })} />
      </BorderView>
    );
  }
}

export default connect((state: StoreState) => ({
  barcode: state.survey.kitBarcode ? state.survey.kitBarcode.code : "",
}))(withNamespaces("barcode")(Barcode));
