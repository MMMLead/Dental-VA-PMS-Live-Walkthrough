import React, { useState } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import MainLayout from './components/layout/MainLayout';
import LoginScreen from './screens/LoginScreen';
import IntroductionScreen from './screens/IntroductionScreen';
import SimulationSummary from './components/dashboard/SimulationSummary';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowIntroduction(true);
  };
  
  const handleStartSimulation = () => {
      setShowIntroduction(false);
  };
  
  const handleEndSimulation = () => {
      setShowSummary(true);
  };

  const handleRestart = () => {
    setShowSummary(false);
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (showIntroduction) {
    return <IntroductionScreen onStartSimulation={handleStartSimulation} />;
  }

  // FIX: The SimulationProvider is wrapped around both conditional routes (MainLayout and SimulationSummary)
  // to ensure a single, persistent context is shared between them. This prevents state loss when
  // switching views and resolves dependency errors for components requiring the context.
  return (
    <SimulationProvider>
      {showSummary ? (
        <SimulationSummary onRestart={handleRestart} />
      ) : (
        <MainLayout onEndSimulation={handleEndSimulation} />
      )}
    </SimulationProvider>
  );
}
