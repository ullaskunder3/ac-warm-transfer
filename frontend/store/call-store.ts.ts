import { create } from "zustand";
import type { Room } from "livekit-client";

export type CallStep = "connect" | "controller" | "transfer" | "end";

interface CallState {
  // Current step in the flow
  currentStep: CallStep;

  // LiveKit room instance
  room: Room | null;

  // Participants
  activeMembers: string[];

  // Transcription
  transcript: string;
  isTranscribing: boolean;

  // Transfer state
  isTransferring: boolean;
  transferSummary: string;

  // Error handling
  error: string | null;

  // Actions
  setCurrentStep: (step: CallStep) => void;
  setRoom: (room: Room | null) => void;
  setActiveMembers: (members: string[]) => void;
  setTranscript: (transcript: string) => void;
  appendTranscript: (text: string) => void;
  setIsTranscribing: (isTranscribing: boolean) => void;
  setIsTransferring: (isTransferring: boolean) => void;
  setTransferSummary: (summary: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  currentStep: "connect",
  room: null,
  activeMembers: [],
  transcript: "",
  isTranscribing: false,
  isTransferring: false,
  transferSummary: "",
  error: null,

  setCurrentStep: (step) => set({ currentStep: step }),
  setRoom: (room) => set({ room }),
  setActiveMembers: (members) => set({ activeMembers: members }),
  setTranscript: (transcript) => set({ transcript }),
  appendTranscript: (text) =>
    set({ transcript: get().transcript + " " + text }),
  setIsTranscribing: (isTranscribing) => set({ isTranscribing }),
  setIsTransferring: (isTransferring) => set({ isTransferring }),
  setTransferSummary: (summary) => set({ transferSummary: summary }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentStep: "connect",
      room: null,
      activeMembers: [],
      transcript: "",
      isTranscribing: false,
      isTransferring: false,
      transferSummary: "",
      error: null,
    }),
}));
