import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "@/src/assets/images";
import { audioUrl, jsonData } from "../constants/DummyData";

type TranscriptEntry = {
  text: string;
  start: number;
  speaker: string;
};

// Transform JSON data
const transcript = jsonData.speakers
  .flatMap((speaker) =>
    speaker.phrases.map((phrase) => ({
      text: phrase.words,
      start: phrase.time / 1000,
      speaker: speaker.name,
    }))
  )
  .sort((a, b) => a.start - b.start);

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

export default function App() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0); // Current playback position in seconds
  const [duration, setDuration] = useState<number | any>(0); // Total duration of the audio in seconds
  const [currentPhrase, setCurrentPhrase] = useState<TranscriptEntry | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const soundRef = useRef<Audio.Sound | null>(null);
  const flatListRef = useRef<FlatList<TranscriptEntry>>(null);
  const insets = useSafeAreaInsets();

  // Load audio and
  async function loadAudio() {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      setSound(sound);

      // Set up playback
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          console.log("status.positionMillis", status.positionMillis);
          setIsLoading(false);
          setPosition(status.positionMillis / 1000);
          setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);

          // Highlight
          const current = transcript.find(
            (phrase, index) =>
              phrase.start <= status.positionMillis / 1000 &&
              (index === transcript.length - 1 ||
                transcript[index + 1].start > status.positionMillis / 1000)
          );
          setCurrentPhrase(current || null);

          //  reset the state
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            setCurrentPhrase(null);
            await sound.stopAsync();
          }
        }
      });
    } catch (error) {
      console.error("Error loading audio:", error);
    }
  }

  // Play audio
  async function play() {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }

  // Pause audio
  async function pause() {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }

  // Rewind audio
  function rewind() {
    if (!currentPhrase) return;

    const currentIndex = transcript.findIndex(
      (phrase) => phrase === currentPhrase
    );

    if (currentIndex > 0) {
      const prevPhrase = transcript[currentIndex - 1];
      soundRef.current?.setPositionAsync(prevPhrase.start * 1000);
      setCurrentPhrase(prevPhrase);
    }
  }

  // Forward audio
  function forward() {
    if (!currentPhrase) return;

    const currentIndex = transcript.findIndex(
      (phrase) => phrase === currentPhrase
    );

    if (currentIndex !== -1 && currentIndex < transcript.length - 1) {
      const nextPhrase = transcript[currentIndex + 1];
      soundRef.current?.setPositionAsync(nextPhrase.start * 1000);
      setCurrentPhrase(nextPhrase);
    }
  }

  // Clean up audio on unmount
  useEffect(() => {
    loadAudio();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (currentPhrase) {
      const index = transcript.findIndex((phrase) => phrase === currentPhrase);
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      }
    }
  }, [currentPhrase]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerView, { height: insets.top }]}></View>
      <FlatList
        data={transcript}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={[styles.contentContainerStyle, {}]}
        renderItem={({ item }) => {
          const isCurrent = item === currentPhrase;
          const isLeft = item.speaker === "John"; // Change dynamically based on the speaker

          return (
            <View
              style={[
                styles.bubbleContainer,
                isLeft ? styles.alignLeft : styles.alignRight,
              ]}
            >
              <Text
                style={[
                  styles.speaker,
                  isLeft ? styles.alignLeft : styles.alignRight,
                  isCurrent && styles.highlightText,
                ]}
              >
                {item.speaker}
              </Text>

              <View
                style={[
                  styles.bubble,
                  isLeft ? styles.leftBubble : styles.rightBubble,
                  isCurrent && styles.highlightBubble,
                ]}
              >
                <Text style={[styles.text, isCurrent && styles.highlightText]}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.bottomView, { paddingBottom: insets.bottom }]}>
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progress,
              { width: `${(position / duration) * 100 || 0}%` },
            ]}
          />
        </View>

        {/* Time  */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={rewind}>
            <Image source={Images.rewind} style={styles.controlImage} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={isPlaying ? pause : play}
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size={25} color={"#000"} />
            ) : (
              <Image
                source={isPlaying ? Images.pause : Images.play}
                style={styles.controlImage}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={forward}>
            <Image source={Images.forward} style={styles.controlImage} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  headerView: {
    paddingVertical: 50,
    backgroundColor: "#ffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentContainerStyle: {
    flexGrow: 1,
    padding: 20,
  },
  bubbleContainer: {
    flexDirection: "column",
    marginVertical: 10,
    width: "75%",
    gap: 5,
  },
  alignLeft: { alignSelf: "flex-start" },
  alignRight: { alignSelf: "flex-end" },

  bottomView: {
    backgroundColor: "#ffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  speaker: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#000000",
  },

  bubble: {
    padding: 12,
    borderRadius: 10,
  },
  leftBubble: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 0,
  },
  rightBubble: {
    backgroundColor: "#fff",
    borderTopRightRadius: 0,
  },

  highlightBubble: {
    backgroundColor: "#E1E4FF",
  },
  highlightText: {
    color: "#DBA604",
    fontWeight: "bold",
  },

  text: {
    fontSize: 16,
    color: "#1B1B1B",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  progressBar: {
    height: 10,
    backgroundColor: "rgba(135, 148, 255, 0.2)",
    width: "100%",
    marginTop: 10,
    position: "absolute",
    alignSelf: "center",
    top: -20,
  },
  progress: {
    height: 10,
    backgroundColor: "#DBA604",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // marginTop: 20,
    gap: 30,
    paddingBottom: 10,
  },
  controlImage: {
    height: 25,
    width: 25,
  },
  button: {
    marginHorizontal: 15,
    padding: 10,
    backgroundColor: "rgba(135, 148, 255, 0.2)",
    borderRadius: 5,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    marginHorizontal: 15,
  },
  timeText: {
    fontSize: 14,
    color: "#555",
  },
});
