import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './pages/LoginPage';
import DashboardMagasinier from './pages/DashboardMagasinier';
import DashboardTechnique from './pages/DashboardTechnique';
import DashboardChefAtelier from './pages/DashboardChefAtelier';
import DashboardDirecteurs from './pages/DashboardDirecteurs';

function App() {
  const [user, setUser] = useState(null);

  // Fonction pour rendre le dashboard approprié
  const renderDashboard = () => {
    if (!user) {
      return <Login onLoginSuccess={setUser} />;
    }

    // Routing selon le rôle
    switch(user.role) {
      case 'MAGASINIER':
        return <DashboardMagasinier user={user} />;
      
      case 'DIR_TECHNIQUE':
      case 'DIR_TECHNIQUE_GENERAL':
      case 'ADMIN':
        return <DashboardTechnique user={user} />;
      
      case 'CHEF_ATELIER':
        return <DashboardChefAtelier user={user} />;
      
      case 'DIR_GENERAL':
      case 'DIR_COMMERCIAL':
        return <DashboardDirecteurs user={user} />;
      
      default:
        return <DashboardMagasinier user={user} />;
    }
  };

  return (
    <>
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '2px solid #d1fae5',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '2px solid #fecaca',
            },
          },
        }}
      />
      {renderDashboard()}
    </>
  );
}

export default App;