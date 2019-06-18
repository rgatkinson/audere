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
} from "react-native";
import { NavigationEvents } from "react-navigation";
import { Ionicons } from "@expo/vector-icons";
import Video from "react-native-video";
import Divider from "./Divider";
import { BORDER_COLOR, GUTTER, VIDEO_ASPECT_RATIO } from "../styles";
import { getRemoteConfig } from "../../util/remoteConfig";
import { tracker, VideoEvents } from "../../util/tracker";
import { videoConfig, VideoConfig } from "../../resources/VideoConfig";

interface Props extends React.Props<VideoPlayer> {
  id: string;
}

const THREE_SECONDS_MS = 3000;

export default class VideoPlayer extends React.Component<Props> {
  state = {
    loggedFirstPlay: false,
    paused: true,
    showThumbnail: true,
  };

  _config: VideoConfig | undefined;

  constructor(props: Props) {
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
          tracker.logEvent(VideoEvents.START_VIDEO, {
            video: this.props.id,
          });
          this.setState({ loggedFirstPlay: true });
        }
      } else {
        tracker.logEvent(VideoEvents.VIDEO_PROGRESS, {
          video: this.props.id,
          currentTime: Math.round(currentTime),
          totalTime: Math.round(seekableDuration),
        });
      }
    }
  };

  _onEnd = () => {
    tracker.logEvent(VideoEvents.COMPLETE_VIDEO, {
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
    const showVideos = getRemoteConfig("showVideos");
    if (!showVideos || this._config == null) {
      return <View />;
    }

    return (
      <View>
        <NavigationEvents onWillBlur={this._pauseVideo} />
        <Divider />
        {this.state.showThumbnail && (
          <TouchableWithoutFeedback
            onPress={this._playVideo}
            style={styles.thumbnail}
          >
            <View style={styles.thumbnail}>
              <View style={styles.iconContainer}>
                <Ionicons
                  color="white"
                  name="ios-play"
                  size={45}
                  style={styles.icon}
                />
              </View>
              <Image
                source={{ uri: this._config.thumbnail }}
                style={styles.thumbnail}
              />
            </View>
          </TouchableWithoutFeedback>
        )}
        <Video
          controls={true}
          paused={this.state.paused}
          ignoreSilentSwitch="obey"
          playInBackground={false}
          progressUpdateInterval={THREE_SECONDS_MS}
          ref={this._videoPlayer}
          repeat={false}
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
  video: {
    aspectRatio: VIDEO_ASPECT_RATIO,
    marginBottom: GUTTER,
    width: "100%",
  },
});
