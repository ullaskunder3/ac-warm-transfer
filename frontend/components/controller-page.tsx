"use client";

import { useRef } from "react";
import { useCallStore } from "../store/call-store.ts";

export default function ControllerPage() {
  const {
    room,
    activeMembers,
    transcript,
    isTranscribing,
    error,
    setTranscript,
    appendTranscript,
    setIsTranscribing,
    setCurrentStep,
    setError,
  } = useCallStore();

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTranscription = async () => {
    try {
      setError(null);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (!response.ok) {
        throw new Error("Failed to get transcription credentials");
      }

      const { websocketUrl, token } = await response.json();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      const socket = new WebSocket(websocketUrl, ["token", token]);
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
        if (result) appendTranscript(result);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Transcription connection failed");
        setIsTranscribing(false);
      };

      setIsTranscribing(true);
    } catch (err) {
      console.error("Failed to start transcription:", err);
      setError(
        "Failed to start audio transcription. Please check microphone permissions and API configuration."
      );
    }
  };

  const stopTranscription = () => {
    mediaRecorderRef.current?.stop();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current?.close();
    setIsTranscribing(false);
  };

  const initiateTransfer = () => {
    setCurrentStep("transfer");
  };

  return (
    <div className="call-container">
      <div className="step-header">
        <h1 className="step-title">Call Controller</h1>
        <p className="step-subtitle">Manage audio and prepare for transfer</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="members-list">
        {activeMembers.map((member) => (
          <div key={member} className="member-item">
            {member} {member === "AgentA" && "(Agent A)"}
          </div>
        ))}
      </div>

      <div className="transcript-container">
        <div className="transcript-title">
          Live Transcription
          <span
            className={`status-indicator ${
              isTranscribing ? "status-connected" : "status-disconnected"
            }`}
          ></span>
          {isTranscribing ? "Recording" : "Stopped"}
        </div>
        <div className="transcript-text">
          {transcript || "No speech detected yet..."}
        </div>
      </div>

      <div className="controls-section">
        <button
          className="button"
          onClick={isTranscribing ? stopTranscription : startTranscription}
        >
          {isTranscribing ? "Stop Audio" : "Start Audio"}
        </button>

        <button className="button" onClick={initiateTransfer} disabled={!room}>
          Transfer Call to Agent B
        </button>

        <button
          className="button button-secondary"
          onClick={() => setCurrentStep("connect")}
        >
          Back to Connection
        </button>
      </div>
    </div>
  );
}
