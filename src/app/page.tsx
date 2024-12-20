/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useRef, useEffect } from "react";
import "tailwindcss/tailwind.css";
import io, { Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { DefaultEventsMap } from "@socket.io/component-emitter";

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

type sharedState = {
  tracks: any[];
  trackBeats: any;
  trackSounds: any;
  bpm: number;
  gridSize: number;
  isPlaying: boolean;
  currentBeat: number;
};

const MusicSampler: React.FC = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [tracks, setTracks] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<number>(8);
  const [trackBeats, setTrackBeats] = useState<{ [key: string]: boolean[] }>(
    {}
  );
  const [trackSounds, setTrackSounds] = useState<{ [key: string]: string }>({});
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const connectToServer = () => {
    socket = io(process.env.NEXT_PUBLIC_SERVER_URL as string);

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("stateUpdate", (state) => {
      setTracks(state.tracks);
      setTrackBeats(state.trackBeats);
      setTrackSounds(state.trackSounds);
      setGridSize(state.gridSize);
      setIsPlaying(state.isPlaying);
      setCurrentBeat(state.currentBeat);
      setBpm(state.bpm);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;
      const intervalId = setInterval(() => {
        setCurrentBeat((prevBeat) => (prevBeat + 1) % gridSize);
      }, interval);

      return () => clearInterval(intervalId);
    }
  }, [isPlaying, bpm, gridSize]);

  useEffect(() => {
    if (isPlaying) {
      tracks.forEach((track) => {
        if (trackBeats[track][currentBeat]) {
          playAudio(trackSounds[track]);
        }
      });
    }
  }, [currentBeat]);

  const emitStateChange = (updatedState: Partial<sharedState>) => {
    // Update local state first
    if (updatedState.tracks !== undefined) setTracks(updatedState.tracks);
    if (updatedState.trackBeats !== undefined)
      setTrackBeats(updatedState.trackBeats);
    if (updatedState.trackSounds !== undefined)
      setTrackSounds(updatedState.trackSounds);
    if (updatedState.bpm !== undefined) setBpm(updatedState.bpm);
    if (updatedState.gridSize !== undefined) setGridSize(updatedState.gridSize);
    if (updatedState.isPlaying !== undefined)
      setIsPlaying(updatedState.isPlaying);
    if (updatedState.currentBeat !== undefined)
      setCurrentBeat(updatedState.currentBeat);

    // Emit the state change to the server
    socket.emit("stateChange", updatedState);
  };

  const handleReset = () => {
    socket.emit("resetState");
  };

  const addTrack = () => {
    const newTrack = uuidv4();
    const updatedTracks = [...tracks, newTrack];
    const updatedTrackBeats = {
      ...trackBeats,
      [newTrack]: Array(gridSize).fill(false),
    };
    const updatedTrackSounds = {
      ...trackSounds,
      [newTrack]: "Kick",
    };

    emitStateChange({
      tracks: updatedTracks,
      trackBeats: updatedTrackBeats,
      trackSounds: updatedTrackSounds,
    });
  };

  const removeTrack = (trackToRemove: string) => {
    const updatedTracks = tracks.filter((track) => track !== trackToRemove);
    const { [trackToRemove]: _, ...updatedTrackBeats } = trackBeats;
    const { [trackToRemove]: __, ...updatedTrackSounds } = trackSounds;

    emitStateChange({
      tracks: updatedTracks,
      trackBeats: updatedTrackBeats,
      trackSounds: updatedTrackSounds,
    });
  };

  const handleGridSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newSize = parseInt(event.target.value, 10);
    const updatedTrackBeats = { ...trackBeats };

    for (const track in updatedTrackBeats) {
      const beats = updatedTrackBeats[track];
      if (newSize > beats.length) {
        updatedTrackBeats[track] = [
          ...beats,
          ...Array(newSize - beats.length).fill(false),
        ];
      } else {
        updatedTrackBeats[track] = beats.slice(0, newSize);
      }
    }

    emitStateChange({
      gridSize: newSize,
      trackBeats: updatedTrackBeats,
    });
  };

  const handleBpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(event.target.value, 10);
    emitStateChange({ bpm: newBpm });
  };

  const toggleBeat = (track: string, index: number) => {
    const updatedTrackBeats = { ...trackBeats };
    updatedTrackBeats[track][index] = !updatedTrackBeats[track][index];

    emitStateChange({ trackBeats: updatedTrackBeats });
  };

  const playAudio = (sound: string) => {
    const audio = new Audio(`/${sound.toLowerCase().replace(/ /g, "-")}.wav`);
    audio.play();
  };

  const startPlaying = () => {
    setIsPlaying(true);
    emitStateChange({ isPlaying: true });
  };

  const pauseAudio = () => {
    setIsPlaying(false);
    emitStateChange({ isPlaying: false });
  };

  const stopAudio = () => {
    setIsPlaying(false);
    setCurrentBeat(0);
    emitStateChange({ isPlaying: false, currentBeat: 0 });
  };

  const handleSoundChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    track: string
  ) => {
    const updatedTrackSounds = { ...trackSounds };
    updatedTrackSounds[track] = event.target.value;

    emitStateChange({ trackSounds: updatedTrackSounds });
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      <div className="flex flex-row">
        <h1 className="text-3xl font-bold mb-4">
          Socket-connected timeline-based music sampler
        </h1>
        <button
          className="ml-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
          onClick={() =>
            window.open("https://github.com/litmify/CTP431-2024F", "_blank")
          }
        >
          Open README.md (Github)
        </button>
      </div>
      {!connected && (
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
          onClick={connectToServer}
        >
          Connect
        </button>
      )}
      {connected && (
        <>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
            onClick={addTrack}
          >
            Add Track
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4 ml-2"
            onClick={handleReset}
          >
            Reset State
          </button>
          <div className="mb-4">
            <label htmlFor="gridSize" className="mr-2">
              Grid Size:{" "}
            </label>
            <select
              id="gridSize"
              value={gridSize}
              onChange={handleGridSizeChange}
              className="bg-gray-800 text-white p-2 rounded"
            >
              <option value={8}>8 Beats</option>
              <option value={16}>16 Beats</option>
              <option value={32}>32 Beats</option>
              <option value={64}>64 Beats</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="bpm" className="mr-2">
              BPM:{" "}
            </label>
            <input
              id="bpm"
              type="number"
              value={bpm}
              onChange={handleBpmChange}
              min="60"
              max="200"
              className="bg-gray-800 text-white p-2 rounded"
            />
          </div>
          <div className="timeline">
            {tracks.map((track) => (
              <div
                key={track}
                className={`track p-4 mb-2 rounded cursor-pointer ${
                  currentTrack === track ? "bg-gray-700" : "bg-gray-800"
                }`}
                onClick={() => setCurrentTrack(track)}
              >
                Track ID: {track}
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded ml-2"
                  onClick={() => removeTrack(track)}
                >
                  Remove
                </button>
                <div className="mt-2">
                  <label htmlFor={`sound-${track}`} className="mr-2">
                    Sound:{" "}
                  </label>
                  <select
                    id={`sound-${track}`}
                    value={trackSounds[track]}
                    onChange={(event) => handleSoundChange(event, track)}
                    className="bg-gray-700 text-white p-2 rounded"
                  >
                    <option value="Kick">Kick</option>
                    <option value="Snare">Snare</option>
                    <option value="Hihat-closed">Hi-hat(closed)</option>
                    <option value="Hihat-open">Hi-hat(open)</option>
                    <option value="Ride">Ride</option>
                    <option value="Crash">Crash</option>
                    <option value="China">China</option>
                    <option value="Cowbell">Cowbell</option>
                  </select>
                </div>
                <div className="beats mt-2 flex">
                  {trackBeats[track]?.map((beat, beatIndex) => (
                    <button
                      key={beatIndex}
                      className={`beat w-8 h-8 mr-1 rounded ${
                        beat ? "bg-blue-500" : "bg-gray-600"
                      } ${
                        currentBeat === beatIndex ? "border-2 border-white" : ""
                      }`}
                      onClick={() => toggleBeat(track, beatIndex)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="controls mt-4">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={startPlaying}
            >
              Play
            </button>
            <button
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={pauseAudio}
            >
              Pause
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={stopAudio}
            >
              Stop
            </button>
          </div>
        </>
      )}

      <audio ref={audioRef} src="/kick.wav" />
    </div>
  );
};

export default MusicSampler;
