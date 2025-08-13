import React, { useState } from 'react';
import Dashboard from './Dashboard';
import Login from './Login';

const Router = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <Login />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-router">
      {renderView()}
    </div>
  );
};

export default Router;
