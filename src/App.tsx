import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import GestioneClassi from './components/GestioneClassi';
import GestioneMaterie from './components/GestioneMaterie';
import GestioneAlunni from './components/GestioneAlunni';
import RegistroVoti from './components/RegistroVoti';
import MedieStatistiche from './components/MedieStatistiche';
import DatabaseManager from './components/DatabaseManager';

function App() {
  const [activeSection, setActiveSection] = useState('classi');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'classi':
        return <GestioneClassi />;
      case 'materie':
        return <GestioneMaterie />;
      case 'alunni':
        return <GestioneAlunni />;
      case 'registro':
        return <RegistroVoti />;
      case 'medie':
        return <MedieStatistiche />;
      case 'database':
        return <DatabaseManager />;
      default:
        return <GestioneClassi />;
    }
  };

  // Se non autenticato, mostra schermata di login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AppProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {renderActiveSection()}
          </div>
          <footer className="bg-white border-t border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>📚</span>
                <span>Sistema di Gestione Registro Scolastico</span>
              </div>
              <div className="text-center">
                <span>© 2025 Fabio Sabatelli - Tutti i diritti riservati</span>
              </div>
              <div className="text-right">
                <span>Versione 1.0</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;