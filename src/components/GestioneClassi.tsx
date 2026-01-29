import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Classe } from '../types';

export default function GestioneClassi() {
  const { classi, alunni, addClasse, updateClasse, deleteClasse } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', anno: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.anno) return;

    if (editingClasse) {
      const classeAggiornata: Classe = {
        ...editingClasse,
        nome: formData.nome,
        anno: formData.anno,
      };
      updateClasse(classeAggiornata);
    } else {
      const nuovaClasse: Classe = {
        id: Date.now().toString(),
        nome: formData.nome,
        anno: formData.anno,
      };
      addClasse(nuovaClasse);
    }

    setFormData({ nome: '', anno: '' });
    setEditingClasse(null);
    setShowForm(false);
  };

  const handleEdit = (classe: Classe) => {
    setEditingClasse(classe);
    setFormData({ nome: classe.nome, anno: classe.anno });
    setShowForm(true);
  };

  const handleDelete = (classeId: string) => {
    deleteClasse(classeId);
    setShowDeleteConfirm(null);
  };

  const handleCancelEdit = () => {
    setEditingClasse(null);
    setFormData({ nome: '', anno: '' });
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestione Classi</h2>
        <button
          onClick={() => {
            setEditingClasse(null);
            setFormData({ nome: '', anno: '' });
            setShowForm(!showForm);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuova Classe</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingClasse ? 'Modifica Classe' : 'Aggiungi Nuova Classe'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Classe
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="es. 3A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anno Scolastico
              </label>
              <input
                type="text"
                value={formData.anno}
                onChange={(e) => setFormData({ ...formData, anno: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="es. 2024/2025"
                required
              />
            </div>
            <div className="col-span-2 flex space-x-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingClasse ? 'Aggiorna' : 'Salva'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classi.map((classe) => (
          <div key={classe.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-800">{classe.nome}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(classe)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifica classe"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(classe.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Elimina classe"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Anno: {classe.anno}</p>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Alunni: {alunni.filter(a => a.classeId === classe.id).length}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Conferma Eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Conferma Eliminazione</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questa classe? Verranno eliminati anche tutti gli alunni e i voti associati.
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