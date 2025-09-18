"use client";

import { useState, useEffect } from "react";
import { useCallStore } from "../store/call-store.ts";

export default function TransferPage() {
  const {
    room,
    transcript,
    isTransferring,
    transferSummary,
    activeMembers,
    error,
    setIsTransferring,
    setTransferSummary,
    setActiveMembers,
    setCurrentStep,
    setError,
  } = useCallStore();

  const [transferStatus, setTransferStatus] = useState<
    "preparing" | "transferring" | "completed"
  >("preparing");

  const roomName = "room1";
  const agentIdentity = "AgentA";
  const agentBIdentity = "AgentB";

  const simulateDemoTransfer = async () => {
    setError(null);
    setIsTransferring(true);
    setTransferStatus("transferring");

    // Generate summary from transcript
    const summary =
      transcript.slice(-500) ||
      "Customer called about account access issues. Tried password reset without success. Needs technical assistance.";
    setTransferSummary(summary);

    // Simulate transfer process
    setTimeout(() => {
      const updatedMembers = activeMembers.filter((m) => m !== "AgentA");
      if (!updatedMembers.includes("AgentB")) {
        updatedMembers.push("AgentB");
      }
      setActiveMembers(updatedMembers);
      setTransferStatus("completed");
      setIsTransferring(false);
    }, 3000);
  };

  const executeTransfer = async () => {
    if (!room) return;

    try {
      setError(null);
      setIsTransferring(true);
      setTransferStatus("transferring");

      // Generate summary from transcript
      const summary = transcript.slice(-500) || "No conversation recorded";
      setTransferSummary(summary);

      const response = await fetch("http://localhost:8000/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_name: roomName,
          agentA_id: agentIdentity,
          agentB_id: agentBIdentity,
          summary: summary,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Transfer API failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Transfer Response:", result);

      // Simulate Agent A leaving and Agent B joining
      setTimeout(() => {
        const updatedMembers = activeMembers.filter((m) => m !== "AgentA");
        if (!updatedMembers.includes("AgentB")) {
          updatedMembers.push("AgentB");
        }
        setActiveMembers(updatedMembers);
        setTransferStatus("completed");
        setIsTransferring(false);
      }, 3000);
    } catch (err) {
      console.error("Transfer failed:", err);
      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch")) {
          setError(
            "Cannot connect to backend server for transfer. Please ensure your backend is running."
          );
        } else {
          setError(`Transfer failed: ${err.message}`);
        }
      } else {
        setError("Failed to transfer call. Please try again.");
      }
      setIsTransferring(false);
      setTransferStatus("preparing");
    }
  };

  useEffect(() => {
    // Auto-start transfer when page loads
    executeTransfer();
  }, []);

  const proceedToEndCall = () => {
    setCurrentStep("end");
  };

  return (
    <div className="call-container">
      <div className="step-header">
        <h1 className="step-title">Call Transfer</h1>
        <p className="step-subtitle">Transferring from Agent A to Agent B</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="members-list">
        <div className="members-title">
          <span
            className={`status-indicator ${
              transferStatus === "completed"
                ? "status-connected"
                : "status-transferring"
            }`}
          ></span>
          Transfer Status:{" "}
          {transferStatus === "preparing" && "Preparing Transfer"}
          {transferStatus === "transferring" && "Transferring..."}
          {transferStatus === "completed" && "Transfer Complete"}
        </div>

        <div style={{ marginTop: "15px", fontWeight: "bold" }}>
          Current Participants:
        </div>
        {activeMembers.map((member) => (
          <div key={member} className="member-item">
            {member}
            {member === "AgentA" && " (Agent A - Leaving)"}
            {member === "AgentB" && " (Agent B - Joined)"}
            {member === "foobar" && " (Caller)"}
          </div>
        ))}
      </div>

      <div className="summary-panel">
        <div className="summary-title">Call Summary for Agent B</div>
        <div style={{ lineHeight: "1.5", color: "#333" }}>
          {transferSummary || "Generating summary from conversation..."}
        </div>
      </div>

      <div className="controls-section">
        {transferStatus === "preparing" && (
          <button
            className="button"
            onClick={executeTransfer}
            disabled={isTransferring}
          >
            Start Transfer
          </button>
        )}

        {transferStatus === "transferring" && (
          <button className="button" disabled>
            Transferring...
          </button>
        )}

        {transferStatus === "completed" && (
          <>
            <button className="button" onClick={proceedToEndCall}>
              Continue to Final Room
            </button>
            <button
              className="button button-secondary"
              onClick={() => setCurrentStep("controller")}
            >
              Back to Controller
            </button>
          </>
        )}
      </div>
    </div>
  );
}
