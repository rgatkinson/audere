import React from "react";
import {
  AsyncStorage,
  Clipboard,
  FlatList,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";
import ScreenContainer from "../components/ScreenContainer";
import ContentContainer from "../components/ContentContainer";
import { NavigationScreenProp } from "react-navigation";
import { Constants } from "expo";
import Button from "../components/Button";
import { BARCODE_PREFIX, uploader } from "../../store/uploader";

interface BarcodeInfo {
  barcode: string;
  guid: string;
  csruid?: string;
}

export default class ExportBarcodesScreen extends React.Component {
  static navigationOptions = {
    title: "Barcodes",
  };

  state = {
    barcodes: [],
  };

  async componentDidMount() {
    let barcodes: BarcodeInfo[] = [];
    const guids: string[] = [];
    await AsyncStorage.getAllKeys(async (err, keys) => {
      if (keys != null) {
        const barcodeKeys = keys.filter(key => key.startsWith(BARCODE_PREFIX));
        await AsyncStorage.multiGet(barcodeKeys, (err, stores) => {
          if (stores != null) {
            stores.map((store) => {
              guids.push(store[1]);
              barcodes.push({
                barcode: store[0].substring(BARCODE_PREFIX.length),
                guid: store[1],
              });
            });
          }
        });
        const csruids = await uploader.getExistingCSRUIDs(guids);
        barcodes = barcodes.map(barcodeInfo => {
          if (csruids.has(barcodeInfo.guid)) {
            return {...barcodeInfo, csruid: csruids.get(barcodeInfo.guid)};
          }
          return barcodeInfo;
        });
        this.setState({ barcodes });
      }
    });
  }

  _copyToClipboard = async () => {
    await Clipboard.setString(JSON.stringify(this.state.barcodes));
  };

  _renderItem = ({ item }: { item: BarcodeInfo }) => {
    return (
      <View style={styles.row}>
        <View style={[{ width: "20%" }, styles.textContainer]}>
          <Text style={styles.text}>
            {item.barcode}
          </Text>
        </View>
        <View style={[{ width: "40%" }, styles.textContainer]}>
          <Text style={styles.text}>
            {item.guid}
          </Text>
        </View>
        <View style={[{ flex: 1 }, styles.textContainer]}>
          <Text style={styles.text}>
            {item.csruid}
          </Text>
        </View>
      </View>
    );
  };

  _keyExtractor = (item: BarcodeInfo) => {
    return item.barcode;
  };

  render() {
    return (
      <ScreenContainer>
        <ContentContainer>
          <Text style={styles.headerText as TextStyle}>
            Barcode Log
          </Text>
          <View style={styles.container}>
            {this._renderItem({ item: {
              barcode: "BARCODE",
              guid: "GUID",
              csruid: "CSRUID",
            }})}
            <FlatList data={this.state.barcodes} keyExtractor={this._keyExtractor} renderItem={this._renderItem} />
          </View>
          <Button
            label="Copy"
            primary={true}
            enabled={true}
            onPress={this._copyToClipboard}
          />
        </ContentContainer>
      </ScreenContainer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    margin: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 30,
  },
  row: {
    alignItems: "center",
    borderColor: "#bbb",
    borderBottomWidth: 2,
    flexDirection: "row",
  },
  text: {
    fontSize: 17,
    paddingHorizontal: 5,
  },
  textContainer: {
    paddingVertical: 10,
  },
  copyButton: {
    padding: 20,
    marginTop: 30,
  },
});
