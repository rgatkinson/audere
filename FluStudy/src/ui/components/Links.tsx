import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";

export interface LinkData {
  label: string;
  onPress(): any;
}

interface Props {
  center?: boolean;
  links: LinkData[];
}

class Links extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        {this.props.links.map(link => (
          <TouchableOpacity key={link.label} onPress={link.onPress}>
            <Text
              center={this.props.center}
              content={link.label}
              style={styles.linkStyle}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginVertical: 15,
  },
  linkStyle: {
    color: "#007AFF",
  },
});

export default withNamespaces("links")<Props>(Links);
