import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";

interface Props {
  links: string[];
}

class Links extends React.Component<Props & WithNamespaces> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        {this.props.links.map(linkText => (
          <TouchableOpacity
            key={linkText}
            onPress={() => {
              Alert.alert("Hello :)", "Waiting on content for:\n" + linkText, [
                { text: "Ok", onPress: () => {} },
              ]);
            }}
          >
            <Text content={linkText} style={styles.linkStyle} />
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
