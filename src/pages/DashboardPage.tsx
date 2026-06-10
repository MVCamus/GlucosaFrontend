import DashboardHeader from "../components/dashboard/DashboardHeader";
import SensorBanner from "../components/dashboard/SensorBanner";
import GlucoseChart from "../components/chart/GlucoseChart";
import EventGlucoseSummary from "../components/dashboard/EventGlucoseSummary";
import { useState } from "react";
import SettingsPage from "./SettingsPage";

export default function DashboardPage() {
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="pb-4">
      <DashboardHeader onSettingsClick={() => setShowSettings(true)} />
      <SensorBanner />
      <GlucoseChart />
      <EventGlucoseSummary />
    </div>
  );
}
