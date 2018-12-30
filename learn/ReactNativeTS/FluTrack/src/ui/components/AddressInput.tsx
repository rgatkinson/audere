import React from "react";
import { StyleSheet, View } from "react-native";
import { Address } from "../../store";
import { WithNamespaces, withNamespaces } from "react-i18next";
import NumberInput from "./NumberInput";
import TextInput from "./TextInput";

interface Props {
  autoFocus?: boolean;
  showLocationField?: boolean;
  value?: Address | null;
  onChange(value: Address): void;
  onDone(): void;
}

class AddressInput extends React.Component<Props & WithNamespaces> {
  address = React.createRef<TextInput>();
  city = React.createRef<TextInput>();
  state = React.createRef<TextInput>();
  zipcode = React.createRef<NumberInput>();
  country = React.createRef<TextInput>();

  // TODO: validate on submit
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        {this.props.showLocationField && (
          <TextInput
            autoFocus={this.props.autoFocus}
            placeholder={t("locationName")}
            returnKeyType="next"
            style={styles.textInput}
            value={this.props.value ? this.props.value!.location : undefined}
            onChangeText={(text: string) => {
              const address = this.props.value || {};
              address.location = text;
              this.props.onChange(address);
            }}
            onSubmitEditing={() => this.address.current!.focus()}
          />
        )}
        <TextInput
          autoFocus={this.props.autoFocus && !this.props.showLocationField}
          placeholder={t("streetAddress")}
          ref={this.address}
          returnKeyType="next"
          style={styles.textInput}
          value={this.props.value ? this.props.value!.address : undefined}
          onChangeText={(text: string) => {
            const address = this.props.value || {};
            address.address = text;
            this.props.onChange(address);
          }}
          onSubmitEditing={() => this.city.current!.focus()}
        />
        <TextInput
          placeholder={t("city")}
          ref={this.city}
          returnKeyType="next"
          style={styles.textInput}
          value={this.props.value ? this.props.value!.city : undefined}
          onChangeText={(text: string) => {
            const address = this.props.value || {};
            address.city = text;
            this.props.onChange(address);
          }}
          onSubmitEditing={() => this.state.current!.focus()}
        />
        <View style={{ flexDirection: "row" }}>
          <TextInput
            placeholder={t("state")}
            ref={this.state}
            returnKeyType="next"
            style={[{ flex: 1 }, styles.textInput]}
            value={this.props.value ? this.props.value!.state : undefined}
            onChangeText={(text: string) => {
              const address = this.props.value || {};
              address.state = text;
              this.props.onChange(address);
            }}
            onSubmitEditing={() => this.zipcode.current!.focus()}
          />
          <NumberInput
            placeholder={t("zipcode")}
            ref={this.zipcode}
            returnKeyType="next"
            style={[
              {
                flex: 1,
                borderLeftColor: "#bbb",
                borderLeftWidth: StyleSheet.hairlineWidth,
              },
              styles.textInput,
            ]}
            value={this.props.value ? this.props.value!.zipcode : undefined}
            onChangeText={(text: string) => {
              const address = this.props.value || {};
              address.zipcode = text;
              this.props.onChange(address);
            }}
            onSubmitEditing={() => this.country.current!.focus()}
          />
        </View>
        <TextInput
          placeholder={t("country")}
          ref={this.country}
          returnKeyType="done"
          style={styles.textInput}
          value={this.props.value ? this.props.value!.country : undefined}
          onChangeText={(text: string) => {
            const address = this.props.value || {};
            address.country = text;
            this.props.onChange(address);
          }}
          onSubmitEditing={this.props.onDone}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginVertical: 20,
    marginHorizontal: 30,
  },
  textInput: {
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    height: 44,
    letterSpacing: -0.41,
    lineHeight: 22,
    marginVertical: 0,
  },
});

export default withNamespaces("addressInput")<Props>(AddressInput);
