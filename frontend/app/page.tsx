"use client";
import ConnectPage from "../components/connect-page";
import ControllerPage from "../components/controller-page";
import EndCallPage from "../components/end-call-page";
import TransferPage from "../components/transfer-page";
import { useCallStore } from "../store/call-store.ts";

export default function Page() {
  const { currentStep } = useCallStore();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "connect":
        return <ConnectPage />;
      case "controller":
        return <ControllerPage />;
      case "transfer":
        return <TransferPage />;
      case "end":
        return <EndCallPage />;
      default:
        return <ConnectPage />;
    }
  };

  return <div>{renderCurrentStep()}</div>;
}
