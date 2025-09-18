"use client";

import { useCallStore } from "../store/call-store.ts";

export default function EndCallPage() {
  const {
    room,
    activeMembers,
    transcript,
    transferSummary,
    setCurrentStep,
    reset,
  } = useCallStore();

  const endCall = () => {
    if (room) {
      room.disconnect();
    }
    reset();
    setCurrentStep("connect");
  };

  const backToTransfer = () => {
    setCurrentStep("transfer");
  };

  return (
    <div className="call-container">
      <div className="step-header">
        <h1 className="step-title">Final Room</h1>
        <p className="step-subtitle">Caller + Agent B Connected</p>
      </div>

      <div className="members-list">
        <div className="members-title">
          <span className="status-indicator status-connected"></span>
          Active Call Session
        </div>

        <div style={{ marginTop: "15px", fontWeight: "bold" }}>
          Current Participants:
        </div>
        {activeMembers.map((member) => (
          <div key={member} className="member-item">
            {member}
            {member === "AgentB" && " (Agent B - Handling Call)"}
            {member === "foobar" && " (Caller)"}
          </div>
        ))}
      </div>

      <div className="summary-panel">
        <div className="summary-title">Call Summary</div>
        <div style={{ lineHeight: "1.5", color: "#333", marginBottom: "15px" }}>
          <strong>Previous Context:</strong>
          <br />
          {transferSummary || "No summary available"}
        </div>

        {transcript && (
          <div style={{ lineHeight: "1.5", color: "#333" }}>
            <strong>Full Transcript:</strong>
            <br />
            {transcript}
          </div>
        )}
      </div>

      <div className="controls-section">
        <button className="button button-danger" onClick={endCall}>
          End Call
        </button>

        <button className="button button-secondary" onClick={backToTransfer}>
          Back to Transfer
        </button>
      </div>
    </div>
  );
}
