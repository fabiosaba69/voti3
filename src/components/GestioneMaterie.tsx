import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Materia } from '../types';

export default function GestioneMaterie() {
  const { materie, addMateria, updateMateria, deleteMateria } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', descrizione: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) return;

    if (editingMateria) {
      const materiaAggiornata: Materia = {
        ...editingMateria,
        nome: formData.nome,
        descrizione: formData.descrizione,
      };
      updateMateria(materiaAggiornata);
    } else {
      const nuovaMateria: Materia = {
        id: Date.now().toString(),
        nome: formData.nome,
        descrizione: formData.descrizione,
      };
      addMateria(nuovaMateria);
    }

    setFormData({ nome: '', descrizione: '' });
    setEditingMateria(null);
    setShowForm(false);
  };

  const handleEdit = (materia: Materia) => {
    setEditingMateria(materia);
    setFormData({ nome: materia.nome, descrizione: materia.descrizione });
    setShowForm(true);
  };

  const handleDelete = (materiaId: string) => {
    deleteMateria(materiaId);
    setShowDeleteConfirm(null);
  };

  const handleCancelEdit = () => {
    setEditingMateria(null);
    setFormData({ nome: '', descrizione: '' });
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestione Materie</h2>
        <button
          onClick={() => {
            setEditingMateria(null);
            setFormData({ nome: '', descrizione: '' });
            setShowForm(!showForm);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuova Materia</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingMateria ? 'Modifica Materia' : 'Aggiungi Nuova Materia'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Materia
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="es. Matematica"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione
              </label>
              <textarea
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Descrizione della materia..."
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingMateria ? 'Aggiorna' : 'Salva'}
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
        {materie.map((materia) => (
          <div key={materia.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-800">{materia.nome}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(materia)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifica materia"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(materia.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Elimina materia"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {materia.descrizione && (
              <p className="text-gray-600 text-sm">{materia.descrizione}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal Conferma Eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Conferma Eliminazione</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questa materia? Verranno eliminati anche tutti i voti associati.
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