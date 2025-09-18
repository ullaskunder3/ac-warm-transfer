// app/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  Track,
  RemoteAudioTrack,
} from "livekit-client";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL!;
const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!;

export default function Page() {
  const [room, setRoom] = useState<Room | null>(null);
  const [activeMembers, setActiveMembers] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const roomName = "room1"; // replace with dynamic room if needed
  const callerIdentity = "foobar";
  const agentIdentity = "AgentA";

  // ---- Join LiveKit Room ----
  const joinRoom = async () => {
    try {
      const tokenResponse = await fetch(
        "http://localhost:8000/api/start-call",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caller_id: callerIdentity,
            agentA_id: agentIdentity,
            // room_name: roomName,
          }),
        }
      ).then((res) => res.json());

      console.log("=>>RES===>", tokenResponse);
      console.log("=>>LIVEKIT_URL===>", LIVEKIT_URL);

      const livekitRoom = new Room();
      const token = tokenResponse.agentA.token;
      await livekitRoom.connect(LIVEKIT_URL, token, {
        autoSubscribe: true,
      });

      livekitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("Participant joined:", participant.identity);
        updateActiveMembers(livekitRoom);
        subscribeRemoteTracks(participant);
      });

      livekitRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log("Participant left:", participant.identity);
        updateActiveMembers(livekitRoom);
      });

      setRoom(livekitRoom);
      updateActiveMembers(livekitRoom);
    } catch (err) {
      console.error("Failed to join LiveKit room:", err);
    }
  };

  const updateActiveMembers = (livekitRoom: Room) => {
    const members: string[] = [livekitRoom.localParticipant.identity];
    livekitRoom.remoteParticipants.forEach((p) => members.push(p.identity));
    setActiveMembers(members);
  };

  const subscribeRemoteTracks = (participant: RemoteParticipant) => {
    // get all track publications
    participant.getTrackPublications().forEach((pub) => {
      const track = pub.track;
      if (track && track.kind === Track.Kind.Audio) {
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.srcObject = new MediaStream([
          (track as RemoteAudioTrack).mediaStreamTrack,
        ]);
        document.body.appendChild(audioEl); // optional for testing
      }

      // listen for future subscriptions
      pub.on("subscribed", (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioEl.srcObject = new MediaStream([
            (track as RemoteAudioTrack).mediaStreamTrack,
          ]);
          document.body.appendChild(audioEl);
        }
      });
    });
  };

  // ---- Deepgram Real-Time Transcription ----
  const startTranscription = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      const socket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-3`,
        ["token", DEEPGRAM_API_KEY]
      );
      socketRef.current = socket;

      socket.onopen = () => {
        mediaRecorder.addEventListener("dataavailable", (e) => {
          if (socket.readyState === WebSocket.OPEN) socket.send(e.data);
        });
        mediaRecorder.start(250);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const result = data.channel?.alternatives?.[0]?.transcript;
        if (result) setTranscript((prev) => prev + " " + result);
      };

      setIsTranscribing(true);
    } catch (err) {
      console.error("Failed to start transcription:", err);
    }
  };

  const stopTranscription = () => {
    mediaRecorderRef.current?.stop();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current?.close();
    setIsTranscribing(false);
  };

  // ---- Warm Transfer ----
  const transferCall = async (toAgent: string) => {
    if (!room) return;

    const response = await fetch("http://localhost:8000/api/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_name: roomName,
        agentA_id: agentIdentity,
        agentB_id: toAgent,
        summary: transcript, // <-- send current transcript here
      }),
    }).then((res) => res.json());

    console.log("Transfer Response:", response);
    room.disconnect();
  };

  useEffect(() => {
    joinRoom();
    return () => {
      room?.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Live Call - Room: {roomName}</h1>

      <h3>Active Members:</h3>
      <ul>
        {activeMembers.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>

      <div style={{ marginTop: 20 }}>
        <h3>Transcript:</h3>
        <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 80 }}>
          {transcript || "No speech detected yet..."}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={isTranscribing ? stopTranscription : startTranscription}
        >
          {isTranscribing ? "Stop Transcription" : "Start Transcription"}
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => transferCall("AgentB")}
        >
          Transfer Call to Agent B
        </button>
      </div>
    </div>
  );
}
