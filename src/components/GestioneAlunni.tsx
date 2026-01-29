import React, { useState } from 'react';
import { Plus, FileDown, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Alunno } from '../types';
import { esportaSchedaAlunno } from '../utils/pdfExport';
import { esportaSchedaAlunnoExcel } from '../utils/excelExport';

export default function GestioneAlunni() {
  const { 
    classi, 
    alunni, 
    materie, 
    voti, 
    medie, 
    addAlunno, 
    updateAlunno, 
    deleteAlunno 
  } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingAlunno, setEditingAlunno] = useState<Alunno | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    dataNascita: '',
    classeId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.cognome || !formData.classeId) return;

    if (editingAlunno) {
      const alunnoAggiornato: Alunno = {
        ...editingAlunno,
        nome: formData.nome,
        cognome: formData.cognome,
        dataNascita: formData.dataNascita,
        classeId: formData.classeId,
      };
      updateAlunno(alunnoAggiornato);
    } else {
      const nuovoAlunno: Alunno = {
        id: Date.now().toString(),
        nome: formData.nome,
        cognome: formData.cognome,
        dataNascita: formData.dataNascita,
        classeId: formData.classeId,
      };
      addAlunno(nuovoAlunno);
    }

    setFormData({ nome: '', cognome: '', dataNascita: '', classeId: '' });
    setEditingAlunno(null);
    setShowForm(false);
  };

  const handleEdit = (alunno: Alunno) => {
    setEditingAlunno(alunno);
    setFormData({
      nome: alunno.nome,
      cognome: alunno.cognome,
      dataNascita: alunno.dataNascita,
      classeId: alunno.classeId,
    });
    setShowForm(true);
  };

  const handleDelete = (alunnoId: string) => {
    deleteAlunno(alunnoId);
    setShowDeleteConfirm(null);
  };

  const handleCancelEdit = () => {
    setEditingAlunno(null);
    setFormData({ nome: '', cognome: '', dataNascita: '', classeId: '' });
    setShowForm(false);
  };

  const handleEsportaScheda = (alunnoId: string) => {
    esportaSchedaAlunno(
      {
        classi,
        materie,
        alunni,
        voti,
        medie
      },
      alunnoId
    );
  };

  const handleEsportaSchedaExcel = (alunnoId: string) => {
    esportaSchedaAlunnoExcel(
      {
        classi,
        materie,
        alunni,
        voti,
        medie
      },
      alunnoId
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestione Alunni</h2>
        <button
          onClick={() => {
            setEditingAlunno(null);
            setFormData({ nome: '', cognome: '', dataNascita: '', classeId: '' });
            setShowForm(!showForm);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuovo Alunno</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingAlunno ? 'Modifica Alunno' : 'Aggiungi Nuovo Alunno'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cognome
              </label>
              <input
                type="text"
                value={formData.cognome}
                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data di Nascita
              </label>
              <input
                type="date"
                value={formData.dataNascita}
                onChange={(e) => setFormData({ ...formData, dataNascita: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classe
              </label>
              <select
                value={formData.classeId}
                onChange={(e) => setFormData({ ...formData, classeId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleziona classe...</option>
                {classi.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nome} - {classe.anno}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex space-x-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingAlunno ? 'Aggiorna' : 'Salva'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cognome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data di Nascita
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alunni
              .sort((a, b) => {
                const classeA = classi.find(c => c.id === a.classeId);
                const classeB = classi.find(c => c.id === b.classeId);
                const nomeClasseA = classeA ? classeA.nome : '';
                const nomeClasseB = classeB ? classeB.nome : '';
                
                // Prima ordina per classe
                if (nomeClasseA !== nomeClasseB) {
                  return nomeClasseA.localeCompare(nomeClasseB);
                }
                
                // Poi ordina alfabeticamente per cognome e nome
                const cognomeCompare = a.cognome.localeCompare(b.cognome);
                if (cognomeCompare !== 0) {
                  return cognomeCompare;
                }
                
                return a.nome.localeCompare(b.nome);
              })
              .map((alunno) => {
              const classe = classi.find(c => c.id === alunno.classeId);
              return (
                <tr key={alunno.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classe ? `${classe.nome} - ${classe.anno}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {alunno.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alunno.cognome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alunno.dataNascita ? new Date(alunno.dataNascita).toLocaleDateString('it-IT') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(alunno)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifica alunno"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(alunno.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina alunno"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEsportaScheda(alunno.id)}
                        className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                        title="Esporta scheda PDF"
                      >
                        <FileDown className="h-3 w-3" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleEsportaSchedaExcel(alunno.id)}
                        className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                        title="Esporta scheda Excel"
                      >
                        <FileDown className="h-3 w-3" />
                        <span>Excel</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Conferma Eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Conferma Eliminazione</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo alunno? Verranno eliminati anche tutti i voti associati.
              Questa azione non può essere annullata.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Elimina
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}