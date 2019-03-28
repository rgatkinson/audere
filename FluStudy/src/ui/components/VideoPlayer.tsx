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

interface Props extends React.Props<VideoPlayer> {
  source: { uri: string; type: string };
}

const THREE_SECONDS_MS = 3000;

export default class VideoPlayer extends React.Component<Props> {
  state = {
    loggedFirstPlay: false,
    paused: true,
    rate: 1.0,
    showThumbnail: true,
  };

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
    if (this.state.rate == 1) {
      if (currentTime == 0) {
        if (!this.state.loggedFirstPlay) {
          tracker.logEvent(VideoEvents.START_VIDEO, {
            video: this.props.source.uri,
          });
          this.setState({ loggedFirstPlay: true });
        }
      } else {
        tracker.logEvent(VideoEvents.VIDEO_PROGRESS, {
          video: this.props.source.uri,
          currentTime: Math.round(currentTime),
          totalTime: Math.round(seekableDuration),
        });
      }
    }
  };

  _onEnd = () => {
    tracker.logEvent(VideoEvents.COMPLETE_VIDEO, {
      video: this.props.source.uri,
    });
    this._pauseVideo();
    this.setState({ showThumbnail: true });
  };

  _pauseVideo = () => {
    this.setState({ rate: 0.0 });
  };

  _resetRate = () => {
    // We use rate to pause/unpause on navigation events instead of pause because
    // we never want the video to auto-play.
    this.setState({ rate: 1.0 });
  };

  _playVideo = () => {
    this.setState({ paused: false, showThumbnail: false, rate: 1.0 });
  };

  render() {
    const showVideos = getRemoteConfig("showVideos");
    if (!showVideos) {
      return <View />;
    }

    return (
      <View>
        <NavigationEvents
          onWillFocus={this._resetRate}
          onWillBlur={this._pauseVideo}
        />
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
                source={{ uri: this.props.source.uri + "Thumb" }}
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
          rate={this.state.rate}
          ref={this._videoPlayer}
          repeat={true}
          source={this.props.source}
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
