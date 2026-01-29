import React, { useState } from 'react';
import { Download, Upload, RefreshCw, Database, BarChart3, CheckCircle, AlertCircle, FileText, Save } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { database } from '../utils/database';
import { esportaDatiCompletiExcel } from '../utils/excelExport';

const DatabaseManager: React.FC = () => {
  const { classi, materie, alunni, voti, medie, reloadData } = useApp();
  const [showImport, setShowImport] = useState(false);
  const [showImportVoti, setShowImportVoti] = useState(false);
  const [importText, setImportText] = useState('');
  const [importVotiText, setImportVotiText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showBackupRestore, setShowBackupRestore] = useState(false);

  const handleExport = async () => {
    try {
      const jsonData = await database.exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registro-voti-backup-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Backup completo esportato con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante l\'esportazione completa' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleExportVoti = async () => {
    try {
      const jsonData = await database.exportVotiOnly();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'backup-voti-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Backup voti esportato con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante l\'esportazione voti' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImport = async () => {
    try {
      await database.importData(importText);
      await reloadData();
      setImportText('');
      setShowImport(false);
      setMessage({ type: 'success', text: 'Dati completi importati con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante l\'importazione completa. Verifica il formato dei dati.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImportVoti = async () => {
    try {
      await database.importVotiOnly(importVotiText);
      await reloadData();
      setImportVotiText('');
      setShowImportVoti(false);
      setMessage({ type: 'success', text: 'Voti importati con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante l\'importazione voti. Verifica il formato dei dati.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleFileImportVoti = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportVotiText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleExportExcel = () => {
    try {
      esportaDatiCompletiExcel({
        classi,
        materie,
        alunni,
        voti,
        medie
      });
      
      setMessage({ type: 'success', text: 'Dati esportati in Excel con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante l\'esportazione Excel' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      // Per IndexedDB, il backup è tramite esportazione JSON
      await handleExport();
      
      setMessage({ type: 'success', text: 'Backup database completato' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante il backup del database' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRestoreDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          await database.importData(content);
          await reloadData();
        };
        reader.readAsText(file);
        
        setMessage({ type: 'success', text: 'Database ripristinato con successo!' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Errore durante il ripristino del database' });
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const handleReload = async () => {
    try {
      await reloadData();
      setMessage({ type: 'success', text: 'Dati ricaricati dal database!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante il ricaricamento' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-4">
        <Database className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Gestione Database</h3>
      </div>

      {message && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg mb-4 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{classi.length}</div>
          <div className="text-sm text-gray-600">Classi</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{alunni.length}</div>
          <div className="text-sm text-gray-600">Alunni</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{voti.length}</div>
          <div className="text-sm text-gray-600">Voti</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Backup Completo</span>
        </button>

        <button
          onClick={handleExportVoti}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Backup Solo Voti</span>
        </button>

        <button
          onClick={handleBackupDatabase}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Database className="h-4 w-4" />
          <span>Backup Database</span>
        </button>

        <button
          onClick={handleExportExcel}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Esporta Excel</span>
        </button>

        <button
          onClick={() => setShowImport(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Importa Completo</span>
        </button>

        <button
          onClick={() => setShowImportVoti(true)}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <FileText className="h-4 w-4" />
          <span>Importa Solo Voti</span>
        </button>

        <button
          onClick={() => setShowBackupRestore(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Ripristina DB File</span>
        </button>

        <button
          onClick={handleReload}
          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Database className="h-4 w-4" />
          <span>Ricarica</span>
        </button>
      </div>

      {showImport && (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-semibold mb-3">Importa Dati Completi</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carica file JSON
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oppure incolla i dati JSON
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Incolla qui i dati JSON completi da importare..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Importa
            </button>
            <button
              onClick={() => {
                setShowImport(false);
                setImportText('');
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {showImportVoti && (
        <div className="mt-6 p-4 border border-orange-200 rounded-lg bg-orange-50">
          <h4 className="font-semibold mb-3 text-orange-800">Importa Solo Voti</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carica file JSON voti
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImportVoti}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oppure incolla i dati JSON voti
            </label>
            <textarea
              value={importVotiText}
              onChange={(e) => setImportVotiText(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
              placeholder="Incolla qui i dati JSON dei voti da importare..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleImportVoti}
              disabled={!importVotiText.trim()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Importa Voti
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImportVoti(false);
                setImportVotiText('');
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {showBackupRestore && (
        <div className="mt-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
          <h4 className="font-semibold mb-3 text-indigo-800">Ripristina Database File</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona file backup JSON
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreDatabase}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowBackupRestore(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Informazioni Backup:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>I dati sono memorizzati nel browser tramite IndexedDB</li>
              <li><strong>Backup Completo:</strong> Include classi, materie, alunni e voti</li>
              <li><strong>Backup Solo Voti:</strong> Include solo i voti per trasferimenti rapidi</li>
              <li><strong>Backup JSON:</strong> Formato standard per importazione/esportazione</li>
              <li>Backup automatico consigliato settimanalmente</li>
              <li>L'importazione completa sovrascrive tutti i dati esistenti</li>
              <li>L'importazione voti aggiunge i voti ai dati esistenti</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatabaseManager;