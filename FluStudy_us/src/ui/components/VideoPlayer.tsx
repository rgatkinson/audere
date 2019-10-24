// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Platform,
} from "react-native";
import { NavigationEvents } from "react-navigation";
import { Ionicons } from "@expo/vector-icons";
import Video from "react-native-video";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Divider from "./Divider";
import Text from "./Text";
import { BORDER_COLOR, GUTTER, VIDEO_ASPECT_RATIO } from "../styles";
import { logFirebaseEvent, VideoEvents } from "../../util/tracker";
import { videoConfig, VideoConfig } from "../../resources/VideoConfig";
import { connect } from "react-redux";
import { StoreState } from "../../store";

interface Props extends React.Props<VideoPlayer> {
  id: string;
  isConnected: boolean;
}

const THREE_SECONDS_MS = 3000;

class VideoPlayer extends React.Component<Props & WithNamespaces> {
  state = {
    loggedFirstPlay: false,
    paused: true,
    showThumbnail: true,
  };

  _config: VideoConfig | undefined;

  constructor(props: Props & WithNamespaces) {
    super(props);
    this._config = videoConfig.get(props.id);
  }

  _videoPlayer = React.createRef<any>();

  _onProgress = ({
    currentTime,
    playableDuration,
    seekableDuration,
  }: {
    currentTime: number;
    playableDuration: number;
    seekableDuration: number;
  }) => {
    if (!this.state.paused) {
      if (currentTime == 0) {
        if (!this.state.loggedFirstPlay) {
          logFirebaseEvent(VideoEvents.START_VIDEO, {
            video: this.props.id,
          });
          this.setState({ loggedFirstPlay: true });
        }
      }
    }
  };

  _onEnd = () => {
    logFirebaseEvent(VideoEvents.COMPLETE_VIDEO, {
      video: this.props.id,
    });
    this._pauseVideo();
    this.setState({ showThumbnail: true });
  };

  _pauseVideo = () => {
    this.setState({ paused: true });
  };

  _playVideo = () => {
    this.setState({ paused: false, showThumbnail: false });
  };

  render() {
    if (!this._config) {
      return <View />;
    }

    const { paused, showThumbnail } = this.state;
    const { t, isConnected } = this.props;

    return (
      <View>
        <NavigationEvents onWillBlur={this._pauseVideo} />
        <Divider />
        <TouchableWithoutFeedback
          onPress={paused ? this._playVideo : this._pauseVideo}
          style={styles.thumbnail}
        >
          <View style={styles.thumbnail}>
            {!isConnected ? (
              <View style={[styles.thumbnail, styles.thumbnailOverlay]}>
                <Text bold={true} content={t("offline")} />
              </View>
            ) : (
              (paused || showThumbnail) && (
                <View style={styles.iconContainer}>
                  <Ionicons
                    color="white"
                    name="ios-play"
                    size={45}
                    style={styles.icon}
                  />
                </View>
              )
            )}
            {showThumbnail && (
              <Image
                source={{ uri: this._config.thumbnail }}
                style={styles.thumbnail}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
        <Video
          controls={false}
          paused={this.state.paused}
          ignoreSilentSwitch="obey"
          playInBackground={false}
          progressUpdateInterval={THREE_SECONDS_MS}
          ref={this._videoPlayer}
          repeat={Platform.OS === "ios" ? true : false}
          resizeMode={"contain"}
          source={{ uri: this._config.uri }}
          style={styles.video}
          onEnd={this._onEnd}
          onProgress={this._onProgress}
        />
        <Divider />
      </View>
    );
  }
}

export default connect((state: StoreState) => ({
  isConnected: state.meta.isConnected,
}))(withNamespaces("VideoPlayer")(VideoPlayer));

const styles = StyleSheet.create({
  icon: {
    marginTop: 3,
    marginLeft: 7,
  },
  iconContainer: {
    alignItems: "center",
    backgroundColor: BORDER_COLOR,
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    opacity: 0.8,
    position: "absolute",
    width: 60,
    zIndex: 3,
  },
  thumbnail: {
    alignItems: "center",
    aspectRatio: VIDEO_ASPECT_RATIO,
    justifyContent: "center",
    marginTop: GUTTER,
    position: "absolute",
    width: "100%",
    zIndex: 2,
  },
  thumbnailOverlay: {
    backgroundColor: "rgba(255,255,255, 0.7)",
    paddingRight: "15%",
    paddingLeft: "15%",
    zIndex: 3,
  },
  video: {
    aspectRatio: VIDEO_ASPECT_RATIO,
    marginBottom: GUTTER,
    width: "100%",
  },
});
