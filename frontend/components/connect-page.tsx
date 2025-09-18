"use client";

import { useEffect } from "react";
import {
  Room,
  RoomEvent,
  type RemoteParticipant,
  Track,
  type RemoteAudioTrack,
} from "livekit-client";
import { useCallStore } from "../store/call-store.ts";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

export default function ConnectPage() {
  const {
    room,
    activeMembers,
    error,
    setRoom,
    setActiveMembers,
    setCurrentStep,
    setError,
  } = useCallStore();

  const callerIdentity = "foobar";
  const agentIdentity = "AgentA";

  const joinRoom = async () => {
    try {
      setError(null);

      const response = await fetch("http://localhost:8000/api/start-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller_id: callerIdentity,
          agentA_id: agentIdentity,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const tokenResponse = await response.json();

      if (!tokenResponse.agentA?.token) {
        throw new Error("Invalid token response from server");
      }

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

      livekitRoom.on(RoomEvent.Disconnected, () => {
        console.log("Room disconnected");
        setError("Connection to room lost");
      });

      setRoom(livekitRoom);
      updateActiveMembers(livekitRoom);

      // Auto-advance to controller after successful connection
      setTimeout(() => {
        setCurrentStep("controller");
      }, 2000);
    } catch (err) {
      console.error("Failed to join LiveKit room:", err);
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          setError(
            "Backend server not available. Click 'Try Demo Mode' to see the flow simulation."
          );
        } else {
          setError(`Connection failed: ${err.message}`);
        }
      } else {
        setError("Failed to connect to Agent A. Please try again.");
      }
    }
  };

  const updateActiveMembers = (livekitRoom: Room) => {
    const members: string[] = [livekitRoom.localParticipant.identity];
    livekitRoom.remoteParticipants.forEach((p) => members.push(p.identity));
    setActiveMembers(members);
  };

  const subscribeRemoteTracks = (participant: RemoteParticipant) => {
    participant.getTrackPublications().forEach((pub) => {
      const track = pub.track;
      if (track && track.kind === Track.Kind.Audio) {
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.srcObject = new MediaStream([
          (track as RemoteAudioTrack).mediaStreamTrack,
        ]);
        document.body.appendChild(audioEl);
      }

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

  useEffect(() => {
    joinRoom();
    return () => {
      room?.disconnect();
    };
  }, []);

  return (
    <div className="call-container">
      <div className="step-header">
        <h1 className="step-title">Connecting to Agent A</h1>
        <p className="step-subtitle">
          Establishing connection to the call room...
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="members-list">
        <div className="members-title">
          <span
            className={`status-indicator ${
              room ? "status-connected" : "status-disconnected"
            }`}
          ></span>
          Connection Status:{" "}
        </div>

        {activeMembers.length > 0 && (
          <>
            <div style={{ marginTop: "15px", fontWeight: "bold" }}>
              Active Members:
            </div>
            {activeMembers.map((member) => (
              <div key={member} className="member-item">
                {member} {member === agentIdentity && "(Agent A)"}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="controls-section">
        <button className="button" onClick={joinRoom} disabled={!!room}>
          {room ? "Connected" : "Retry Connection"}
        </button>

        {room && (
          <button
            className="button"
            onClick={() => setCurrentStep("controller")}
          >
            Continue to Controller
          </button>
        )}
      </div>
    </div>
  );
}
