import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, FileDown, Calendar, Users, Calculator, CheckCircle, X, ArrowDown, ArrowUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Voto, ValutazioneType, VALUTAZIONI, calcolaVotoVerifica, Alunno } from '../types';
import { esportaRegistroClasse } from '../utils/pdfExport';
import { esportaRegistroClasseExcel } from '../utils/excelExport';

export default function RegistroVoti() {
  const { 
    classi, 
    materie, 
    alunni, 
    voti, 
    addVoto, 
    addVotiMultipli,
    updateVoto, 
    deleteVoto,
    classeSelezionata,
    materiaSelezionata,
    setClasseSelezionata,
    setMateriaSelezionata
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [showMultipleForm, setShowMultipleForm] = useState(false);
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [editingCell, setEditingCell] = useState<{alunnoId: string, data: string} | null>(null);
  const [editingValue, setEditingValue] = useState<ValutazioneType>('sufficiente');
  const [showAddVotoModal, setShowAddVotoModal] = useState<{alunnoId: string, data: string} | null>(null);
  const [editingVoto, setEditingVoto] = useState<Voto | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [quadrimestreSelezionato, setQuadrimestreSelezionato] = useState<1 | 2>(1);
  const [bulkEditMode, setBulkEditMode] = useState<string | null>(null);
  const [bulkEditValues, setBulkEditValues] = useState<{[alunnoId: string]: {
    valore: ValutazioneType;
    note: string;
    isVerifica: boolean;
    numeroDomande: number;
    risposteEsatte: number;
  }}>({});
  const [sortByDateColumn, setSortByDateColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Form singolo
  const [formData, setFormData] = useState({
    alunnoId: '',
    valore: 'sufficiente' as ValutazioneType,
    data: new Date().toISOString().split('T')[0],
    note: '',
    isVerifica: false,
    numeroDomande: 10,
    risposteEsatte: 6
  });

  // Form multiplo
  const [votiMultipli, setVotiMultipli] = useState<{[key: string]: ValutazioneType}>({});
  const [dataComune, setDataComune] = useState(new Date().toISOString().split('T')[0]);
  const [noteComuni, setNoteComuni] = useState('');
  const [isVerifica, setIsVerifica] = useState(false);
  const [numeroDomande, setNumeroDomande] = useState(10);
  const [risposteEsatte, setRisposteEsatte] = useState<{[key: string]: number}>({});

  // Edit date modal
  const [editDateData, setEditDateData] = useState({
    originalDate: '',
    newDate: '',
    votiToUpdate: [] as Voto[]
  });

  const alunniFiltrati = alunni.filter(a => 
    !classeSelezionata || a.classeId === classeSelezionata
  );

  const votiFiltrati = voti.filter(v => 
    (!classeSelezionata || v.classeId === classeSelezionata) &&
    (!materiaSelezionata || v.materiaId === materiaSelezionata) &&
    v.quadrimestre === quadrimestreSelezionato
  ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Funzione per ordinare gli alunni in base ai voti di una data specifica
  const getSortedAlunni = () => {
    if (!sortByDateColumn) {
      // Ordinamento alfabetico predefinito
      return alunniFiltrati.sort((a, b) => {
        const nomeA = `${a.cognome} ${a.nome}`;
        const nomeB = `${b.cognome} ${b.nome}`;
        return nomeA.localeCompare(nomeB);
      });
    }

    return alunniFiltrati.sort((a, b) => {
      // Trova i voti per la data selezionata
      const votoA = votiFiltrati.find(v => v.alunnoId === a.id && v.data === sortByDateColumn);
      const votoB = votiFiltrati.find(v => v.alunnoId === b.id && v.data === sortByDateColumn);

      // Se uno dei due non ha voto, mettilo alla fine
      if (!votoA && !votoB) {
        // Entrambi senza voto, ordina alfabeticamente
        const nomeA = `${a.cognome} ${a.nome}`;
        const nomeB = `${b.cognome} ${b.nome}`;
        return nomeA.localeCompare(nomeB);
      }
      if (!votoA) return 1; // A alla fine
      if (!votoB) return -1; // B alla fine

      // Entrambi hanno voto, ordina per valore del voto
      const valoreA = VALUTAZIONI[votoA.valore].valore;
      const valoreB = VALUTAZIONI[votoB.valore].valore;

      if (valoreA !== valoreB) {
        return sortDirection === 'desc' ? valoreB - valoreA : valoreA - valoreB;
      }

      // Stesso voto, ordina alfabeticamente
      const nomeA = `${a.cognome} ${a.nome}`;
      const nomeB = `${b.cognome} ${b.nome}`;
      return nomeA.localeCompare(nomeB);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.alunnoId || !classeSelezionata || !materiaSelezionata) return;

    const votoData: Voto = {
      id: editingVoto?.id || Date.now().toString(),
      alunnoId: formData.alunnoId,
      materiaId: materiaSelezionata,
      classeId: classeSelezionata,
      valore: formData.valore,
      data: formData.data,
      note: formData.note,
      quadrimestre: quadrimestreSelezionato,
      tipoVerifica: formData.isVerifica ? {
        numeroDomande: formData.numeroDomande,
        risposteEsatte: formData.risposteEsatte,
        dataVerifica: formData.data,
        noteVerifica: formData.note
      } : undefined
    };

    if (editingVoto) {
      await updateVoto(votoData);
    } else {
      await addVoto(votoData);
    }

    resetForm();
  };

  const handleMultipleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classeSelezionata || !materiaSelezionata) return;

    const votiDaInserire: Voto[] = [];

    if (isVerifica) {
      // Modalità verifica
      Object.entries(risposteEsatte).forEach(([alunnoId, risposte]) => {
        if (risposte >= 0 && risposte <= numeroDomande) {
          const votoCalcolato = calcolaVotoVerifica(risposte, numeroDomande);
          votiDaInserire.push({
            id: `${Date.now()}-${alunnoId}`,
            alunnoId,
            materiaId: materiaSelezionata,
            classeId: classeSelezionata,
            valore: votoCalcolato,
            data: dataComune,
            note: noteComuni,
            quadrimestre: quadrimestreSelezionato,
            tipoVerifica: {
              numeroDomande,
              risposteEsatte: risposte,
              dataVerifica: dataComune,
              noteVerifica: noteComuni
            }
          });
        }
      });
    } else {
      // Modalità voti normali
      Object.entries(votiMultipli).forEach(([alunnoId, valore]) => {
        votiDaInserire.push({
          id: `${Date.now()}-${alunnoId}`,
          alunnoId,
          materiaId: materiaSelezionata,
          classeId: classeSelezionata,
          valore,
          data: dataComune,
          note: noteComuni,
          quadrimestre: quadrimestreSelezionato
        });
      });
    }

    if (votiDaInserire.length > 0) {
      await addVotiMultipli(votiDaInserire);
      resetMultipleForm();
    }
  };

  const resetForm = () => {
    setFormData({
      alunnoId: '',
      valore: 'sufficiente',
      data: new Date().toISOString().split('T')[0],
      note: '',
      isVerifica: false,
      numeroDomande: 10,
      risposteEsatte: 6
    });
    setEditingVoto(null);
    setShowForm(false);
  };

  const resetMultipleForm = () => {
    setVotiMultipli({});
    setDataComune(new Date().toISOString().split('T')[0]);
    setNoteComuni('');
    setIsVerifica(false);
    setNumeroDomande(10);
    setRisposteEsatte({});
    setShowMultipleForm(false);
  };

  const handleEdit = (voto: Voto) => {
    setEditingVoto(voto);
    setFormData({
      alunnoId: voto.alunnoId,
      valore: voto.valore,
      data: voto.data,
      note: voto.note,
      isVerifica: !!voto.tipoVerifica,
      numeroDomande: voto.tipoVerifica?.numeroDomande || 10,
      risposteEsatte: voto.tipoVerifica?.risposteEsatte || 6
    });
    setShowForm(true);
  };

  const handleDelete = async (votoId: string) => {
    await deleteVoto(votoId);
    setShowDeleteConfirm(null);
  };

  const getVotoColorClass = (valore: ValutazioneType) => {
    const colors = {
      'ottimo': 'bg-green-100 text-green-800',
      'distinto': 'bg-blue-100 text-blue-800',
      'buono': 'bg-cyan-100 text-cyan-800',
      'discreto': 'bg-yellow-100 text-yellow-800',
      'sufficiente': 'bg-orange-100 text-orange-800',
      'non-sufficiente': 'bg-red-100 text-red-800'
    };
    return colors[valore] || 'bg-gray-100 text-gray-800';
  };

  const handleEsportaRegistro = () => {
    if (!classeSelezionata || !materiaSelezionata) {
      alert('Seleziona classe e materia per esportare il registro.');
      return;
    }

    esportaRegistroClasse(
      {
        classi,
        materie,
        alunni,
        voti,
        medie: []
      },
      classeSelezionata,
      materiaSelezionata,
      quadrimestreSelezionato
    );
  };

  const handleEsportaRegistroExcel = () => {
    if (!classeSelezionata || !materiaSelezionata) {
      alert('Seleziona classe e materia per esportare il registro.');
      return;
    }

    esportaRegistroClasseExcel(
      {
        classi,
        materie,
        alunni,
        voti,
        medie: []
      },
      classeSelezionata,
      materiaSelezionata,
      quadrimestreSelezionato
    );
  };

  const getDateGroups = () => {
    const groups: {[key: string]: Voto[]} = {};
    votiFiltrati.forEach(voto => {
      if (!groups[voto.data]) {
        groups[voto.data] = [];
      }
      groups[voto.data].push(voto);
    });
    return groups;
  };

  const handleEditDate = (date: string) => {
    const votiDellaData = votiFiltrati.filter(v => v.data === date);
    setEditDateData({
      originalDate: date,
      newDate: date,
      votiToUpdate: votiDellaData
    });
    setShowEditDateModal(true);
  };

  const handleSaveEditDate = async () => {
    if (!editDateData.originalDate || !editDateData.newDate) return;

    // Prima validazione: controlla se la data è cambiata e se è duplicata
    if (editDateData.originalDate !== editDateData.newDate) {
      const dateEsistenti = Array.from(new Set(votiFiltrati.map(v => v.data)));
      if (dateEsistenti.includes(editDateData.newDate)) {
        const conferma = window.confirm(
          `Esiste già una data ${new Date(editDateData.newDate).toLocaleDateString('it-IT')} nel registro. ` +
          'Vuoi comunque procedere? I voti verranno uniti a quella data.'
        );
        if (!conferma) return;
      }
    }

    // Aggiorna tutti i voti con la nuova data
    for (const voto of editDateData.votiToUpdate) {
      const votoAggiornato = { ...voto, data: editDateData.newDate };
      await updateVoto(votoAggiornato);
    }

    setShowEditDateModal(false);
    setEditDateData({ originalDate: '', newDate: '', votiToUpdate: [] });
  };

  // Gestione modifica massiva
  const handleBulkEdit = (data: string) => {
    setBulkEditMode(data);
    
    // Inizializza i valori per tutti gli alunni
    const initialValues: {[alunnoId: string]: any} = {};
    alunniFiltrati.forEach(alunno => {
      const votoEsistente = votiFiltrati.find(v => v.alunnoId === alunno.id && v.data === data);
      initialValues[alunno.id] = {
        valore: votoEsistente?.valore || 'sufficiente',
        note: votoEsistente?.note || '',
        isVerifica: !!votoEsistente?.tipoVerifica,
        numeroDomande: votoEsistente?.tipoVerifica?.numeroDomande || 10,
        risposteEsatte: votoEsistente?.tipoVerifica?.risposteEsatte || 6
      };
    });
    setBulkEditValues(initialValues);
  };

  const handleSaveBulkEdit = async () => {
    if (!bulkEditMode || !classeSelezionata || !materiaSelezionata) return;

    for (const [alunnoId, values] of Object.entries(bulkEditValues)) {
      if (!values.valore) continue; // Salta se non c'è voto

      const votoEsistente = votiFiltrati.find(v => v.alunnoId === alunnoId && v.data === bulkEditMode);
      
      const votoData: Voto = {
        id: votoEsistente?.id || `${Date.now()}-${alunnoId}`,
        alunnoId,
        materiaId: materiaSelezionata,
        classeId: classeSelezionata,
        valore: values.valore,
        data: bulkEditMode,
        note: values.note,
        quadrimestre: quadrimestreSelezionato,
        tipoVerifica: values.isVerifica ? {
          numeroDomande: values.numeroDomande,
          risposteEsatte: values.risposteEsatte,
          dataVerifica: bulkEditMode,
          noteVerifica: values.note
        } : undefined
      };

      if (votoEsistente) {
        await updateVoto(votoData);
      } else {
        await addVoto(votoData);
      }
    }

    setBulkEditMode(null);
    setBulkEditValues({});
  };

  const handleCancelBulkEdit = () => {
    setBulkEditMode(null);
    setBulkEditValues({});
  };

  const updateBulkEditValue = (alunnoId: string, field: string, value: any) => {
    setBulkEditValues(prev => ({
      ...prev,
      [alunnoId]: {
        ...prev[alunnoId],
        [field]: value
      }
    }));
  };

  // Gestione modifica inline
  const handleCellClick = (alunnoId: string, data: string, voto?: Voto) => {
    if (voto) {
      setEditingCell({ alunnoId, data });
      setEditingValue(voto.valore);
    } else {
      setShowAddVotoModal({ alunnoId, data });
    }
  };

  const handleSaveInlineEdit = async () => {
    if (!editingCell || !classeSelezionata || !materiaSelezionata) return;

    const votoEsistente = votiFiltrati.find(v => 
      v.alunnoId === editingCell.alunnoId && v.data === editingCell.data
    );

    if (votoEsistente) {
      const votoAggiornato = { ...votoEsistente, valore: editingValue };
      await updateVoto(votoAggiornato);
    }

    setEditingCell(null);
  };

  const handleCancelInlineEdit = () => {
    setEditingCell(null);
  };

  const handleAddNewVoto = async (formData: {
    valore: ValutazioneType;
    note: string;
    isVerifica: boolean;
    numeroDomande: number;
    risposteEsatte: number;
  }) => {
    if (!showAddVotoModal || !classeSelezionata || !materiaSelezionata) return;

    const nuovoVoto: Voto = {
      id: Date.now().toString(),
      alunnoId: showAddVotoModal.alunnoId,
      materiaId: materiaSelezionata,
      classeId: classeSelezionata,
      valore: formData.valore,
      data: showAddVotoModal.data,
      note: formData.note,
      quadrimestre: quadrimestreSelezionato,
      tipoVerifica: formData.isVerifica ? {
        numeroDomande: formData.numeroDomande,
        risposteEsatte: formData.risposteEsatte,
        dataVerifica: showAddVotoModal.data,
        noteVerifica: formData.note
      } : undefined
    };

    await addVoto(nuovoVoto);
    setShowAddVotoModal(null);
  };

  // Calcola voto automaticamente per le verifiche nel form multiplo
  const calcolaVotoVerificaMultiplo = (alunnoId: string) => {
    const risposte = risposteEsatte[alunnoId];
    if (risposte === undefined || risposte < 0 || risposte > numeroDomande) return null;
    
    const voto = calcolaVotoVerifica(risposte, numeroDomande);
    const percentuale = Math.round((risposte / numeroDomande) * 100);
    
    return { voto, percentuale };
  };

  // Aggiorna il voto calcolato quando cambiano le risposte esatte
  const handleRisposteEsatteChange = (alunnoId: string, value: number) => {
    setRisposteEsatte(prev => ({
      ...prev,
      [alunnoId]: value
    }));
  };

  const handleDateColumnSort = (date: string) => {
    if (sortByDateColumn === date) {
      // Se è già la colonna selezionata, cambia direzione o resetta
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        // Reset all'ordinamento alfabetico
        setSortByDateColumn(null);
        setSortDirection('desc');
      }
    } else {
      // Nuova colonna selezionata
      setSortByDateColumn(date);
      setSortDirection('desc');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Registro Voti</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Voto</span>
          </button>
          <button
            onClick={() => setShowMultipleForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Inserimento Multiplo</span>
          </button>
          <button
            onClick={handleEsportaRegistro}
            disabled={!classeSelezionata || !materiaSelezionata}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileDown className="h-4 w-4" />
            <span>Esporta PDF</span>
          </button>
          <button
            onClick={handleEsportaRegistroExcel}
            disabled={!classeSelezionata || !materiaSelezionata}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileDown className="h-4 w-4" />
            <span>Esporta Excel</span>
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classe</label>
          <select
            value={classeSelezionata || ''}
            onChange={(e) => setClasseSelezionata(e.target.value || null)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleziona classe...</option>
            {classi.map((classe) => (
              <option key={classe.id} value={classe.id}>
                {classe.nome} - {classe.anno}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Materia</label>
          <select
            value={materiaSelezionata || ''}
            onChange={(e) => setMateriaSelezionata(e.target.value || null)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleziona materia...</option>
            {materie.map((materia) => (
              <option key={materia.id} value={materia.id}>
                {materia.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quadrimestre</label>
          <select
            value={quadrimestreSelezionato}
            onChange={(e) => setQuadrimestreSelezionato(Number(e.target.value) as 1 | 2)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1° Quadrimestre</option>
            <option value={2}>2° Quadrimestre</option>
          </select>
        </div>
      </div>

      {/* Form Singolo */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingVoto ? 'Modifica Voto' : 'Nuovo Voto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alunno</label>
                <select
                  value={formData.alunnoId}
                  onChange={(e) => setFormData({ ...formData, alunnoId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleziona alunno...</option>
                  {alunniFiltrati.map((alunno) => (
                    <option key={alunno.id} value={alunno.id}>
                      {alunno.cognome} {alunno.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="isVerifica"
                  checked={formData.isVerifica}
                  onChange={(e) => setFormData({ ...formData, isVerifica: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isVerifica" className="text-sm font-medium text-gray-700">
                  È una verifica
                </label>
              </div>

              {formData.isVerifica ? (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numero Domande
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.numeroDomande}
                        onChange={(e) => setFormData({ ...formData, numeroDomande: Number(e.target.value) })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risposte Esatte
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formData.numeroDomande}
                        value={formData.risposteEsatte}
                        onChange={(e) => {
                          const risposte = Number(e.target.value);
                          const votoCalcolato = calcolaVotoVerifica(risposte, formData.numeroDomande);
                          setFormData({ 
                            ...formData, 
                            risposteEsatte: risposte,
                            valore: votoCalcolato
                          });
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Voto calcolato: </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getVotoColorClass(formData.valore)}`}>
                      {VALUTAZIONI[formData.valore].label}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({Math.round((formData.risposteEsatte / formData.numeroDomande) * 100)}%)
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      Sufficienza da {Math.ceil(formData.numeroDomande / 2)} risposte esatte
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voto</label>
                  <select
                    value={formData.valore}
                    onChange={(e) => setFormData({ ...formData, valore: e.target.value as ValutazioneType })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.entries(VALUTAZIONI).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label} ({val.valore})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingVoto ? 'Aggiorna' : 'Salva'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Multiplo */}
      {showMultipleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Inserimento Multiplo Voti</h3>
            
            <form onSubmit={handleMultipleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                  <input
                    type="date"
                    value={dataComune}
                    onChange={(e) => setDataComune(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isVerificaMultiplo"
                    checked={isVerifica}
                    onChange={(e) => setIsVerifica(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isVerificaMultiplo" className="text-sm font-medium text-gray-700">
                    È una verifica
                  </label>
                </div>
              </div>

              {isVerifica && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="mb-3 text-sm text-blue-700 bg-blue-100 p-2 rounded">
                    <strong>📚 Modalità Scuola Primaria:</strong> Sufficienza dalla metà delle risposte esatte
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numero Domande (comune per tutti)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={numeroDomande}
                    onChange={(e) => setNumeroDomande(Number(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    Sufficienza da: <strong>{Math.ceil(numeroDomande / 2)}</strong> risposte esatte ({Math.round((Math.ceil(numeroDomande / 2) / numeroDomande) * 100)}%)
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (opzionale)
                </label>
                <textarea
                  value={noteComuni}
                  onChange={(e) => setNoteComuni(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Note comuni per tutti i voti..."
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">
                  {isVerifica ? 'Inserisci Risposte Esatte per Alunno' : 'Seleziona Voti per Alunno'}
                </h4>
                
                <div className="max-h-96 overflow-y-auto">
                  {isVerifica ? (
                    <div className="grid grid-cols-3 gap-4 mb-2 font-medium text-gray-700 border-b pb-2">
                      <div>Alunno</div>
                      <div>Risposte Esatte</div>
                      <div>Voto Calcolato</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 mb-2 font-medium text-gray-700 border-b pb-2">
                      <div>Alunno</div>
                      <div>Voto</div>
                    </div>
                  )}
                  
                  {isVerifica && (
                    <div className="mb-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                      <strong>💡 Scala Valutazione:</strong> Ottimo ≥90% | Distinto ≥80% | Buono ≥70% | Discreto ≥60% | Sufficiente ≥50% (da {Math.ceil(numeroDomande / 2)} risposte)
                    </div>
                  )}
                  
                  {alunniFiltrati.map((alunno) => (
                    <div key={alunno.id} className={`grid ${isVerifica ? 'grid-cols-3' : 'grid-cols-2'} gap-4 py-2 border-b border-gray-100`}>
                      <div className="flex items-center">
                        <span className="font-medium">{alunno.cognome} {alunno.nome}</span>
                      </div>
                      
                      {isVerifica ? (
                        <>
                          <div>
                            <input
                              type="number"
                              min="0"
                              max={numeroDomande}
                              value={risposteEsatte[alunno.id] || ''}
                              onChange={(e) => handleRisposteEsatteChange(alunno.id, Number(e.target.value))}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex items-center">
                            {(() => {
                              const risultato = calcolaVotoVerificaMultiplo(alunno.id);
                              if (risultato) {
                                return (
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getVotoColorClass(risultato.voto)}`}>
                                      {VALUTAZIONI[risultato.voto].label}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      ({risultato.percentuale}%)
                                    </span>
                                  </div>
                                );
                              }
                              return <span className="text-gray-400 text-sm">-</span>;
                            })()}
                          </div>
                        </>
                      ) : (
                        <div>
                          <select
                            value={votiMultipli[alunno.id] || ''}
                            onChange={(e) => setVotiMultipli(prev => ({
                              ...prev,
                              [alunno.id]: e.target.value as ValutazioneType
                            }))}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Seleziona voto...</option>
                            {Object.entries(VALUTAZIONI).map(([key, val]) => (
                              <option key={key} value={key}>
                                {val.label} ({val.valore})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isVerifica ? 
                    Object.keys(risposteEsatte).length === 0 : 
                    Object.keys(votiMultipli).length === 0
                  }
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isVerifica ? 'Salva Verifiche' : 'Salva Voti'}
                </button>
                <button
                  type="button"
                  onClick={resetMultipleForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Date */}
      {showEditDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Modifica Data Voti</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Attuale: {new Date(editDateData.originalDate).toLocaleDateString('it-IT')}
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuova Data
                </label>
                <input
                  type="date"
                  value={editDateData.newDate}
                  onChange={(e) => setEditDateData(prev => ({ ...prev, newDate: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                Verranno modificati {editDateData.votiToUpdate.length} voti.
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleSaveEditDate}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Salva
                </button>
                <button
                  onClick={() => setShowEditDateModal(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista Voti */}
      {Object.keys(getDateGroups()).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">Nessun voto presente per i criteri selezionati.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Alunno
                  </th>
                  {Object.keys(getDateGroups()).sort().map((data) => (
                    <th key={data} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      <div className="flex flex-col items-center space-y-1">
                        <div className="flex items-center justify-center space-x-1">
                          <span>
                            {new Date(data).toLocaleDateString('it-IT', { 
                              day: '2-digit', 
                              month: '2-digit' 
                            })}
                          </span>
                          <button
                            onClick={() => handleDateColumnSort(data)}
                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                              sortByDateColumn === data ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                            }`}
                            title={`Ordina per voti del ${new Date(data).toLocaleDateString('it-IT')}`}
                          >
                            {sortByDateColumn === data ? (
                              sortDirection === 'desc' ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUp className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditDate(data)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Modifica data"
                          >
                            <Calendar className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleBulkEdit(data)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Modifica tutti i voti"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedAlunni().map((alunno) => (
                  <tr key={alunno.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                      {alunno.cognome} {alunno.nome}
                    </td>
                    {Object.keys(getDateGroups()).sort().map((data) => {
                      const voto = votiFiltrati.find(v => v.alunnoId === alunno.id && v.data === data);
                      return (
                        <td key={data} className="px-4 py-4 text-center min-w-[120px]">
                          {bulkEditMode === data ? (
                            <div className="space-y-2">
                              <select
                                value={bulkEditValues[alunno.id]?.valore || ''}
                                onChange={(e) => updateBulkEditValue(alunno.id, 'valore', e.target.value)}
                                className="w-full text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Nessun voto</option>
                                {Object.entries(VALUTAZIONI).map(([key, val]) => (
                                  <option key={key} value={key}>
                                    {val.label}
                                  </option>
                                ))}
                              </select>
                              
                              <div className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={bulkEditValues[alunno.id]?.isVerifica || false}
                                  onChange={(e) => updateBulkEditValue(alunno.id, 'isVerifica', e.target.checked)}
                                  className="text-xs"
                                />
                                <span className="text-xs text-gray-600">Verifica</span>
                              </div>
                              
                              {bulkEditValues[alunno.id]?.isVerifica && (
                                <div className="space-y-1">
                                  <input
                                    type="number"
                                    placeholder="Dom."
                                    min="1"
                                    max="100"
                                    value={bulkEditValues[alunno.id]?.numeroDomande || ''}
                                    onChange={(e) => updateBulkEditValue(alunno.id, 'numeroDomande', Number(e.target.value))}
                                    className="w-full text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Esatte"
                                    min="0"
                                    max={bulkEditValues[alunno.id]?.numeroDomande || 10}
                                    value={bulkEditValues[alunno.id]?.risposteEsatte || ''}
                                    onChange={(e) => {
                                      const risposte = Number(e.target.value);
                                      const domande = bulkEditValues[alunno.id]?.numeroDomande || 10;
                                      const votoCalcolato = calcolaVotoVerifica(risposte, domande);
                                      updateBulkEditValue(alunno.id, 'risposteEsatte', risposte);
                                      updateBulkEditValue(alunno.id, 'valore', votoCalcolato);
                                    }}
                                    className="w-full text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  {bulkEditValues[alunno.id]?.risposteEsatte !== undefined && bulkEditValues[alunno.id]?.numeroDomande && (
                                    <div className="text-xs text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${getVotoColorClass(bulkEditValues[alunno.id]?.valore || 'sufficiente')}`}>
                                        {VALUTAZIONI[bulkEditValues[alunno.id]?.valore || 'sufficiente'].label}
                                      </span>
                                      <div className="text-gray-500">
                                        {Math.round((bulkEditValues[alunno.id]?.risposteEsatte / bulkEditValues[alunno.id]?.numeroDomande) * 100)}%
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <textarea
                                placeholder="Note..."
                                value={bulkEditValues[alunno.id]?.note || ''}
                                onChange={(e) => updateBulkEditValue(alunno.id, 'note', e.target.value)}
                                className="w-full text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                            </div>
                          ) : voto ? (
                            editingCell?.alunnoId === alunno.id && editingCell?.data === data ? (
                              <div className="flex flex-col items-center space-y-2">
                                <select
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value as ValutazioneType)}
                                  className="text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                >
                                  {Object.entries(VALUTAZIONI).map(([key, val]) => (
                                    <option key={key} value={key}>
                                      {val.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={handleSaveInlineEdit}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Salva"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={handleCancelInlineEdit}
                                    className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                    title="Annulla"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center space-y-1">
                                <button
                                  onClick={() => handleCellClick(alunno.id, data, voto)}
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${getVotoColorClass(voto.valore)}`}
                                  title="Click per modificare"
                                >
                                  {VALUTAZIONI[voto.valore].label}
                                </button>
                                {voto.tipoVerifica && (
                                  <span className="inline-flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                    <Calculator className="h-2 w-2" />
                                    <span>
                                      {voto.tipoVerifica.risposteEsatte}/{voto.tipoVerifica.numeroDomande}
                                    </span>
                                  </span>
                                )}
                                {voto.note && (
                                  <span className="text-xs text-gray-500 truncate max-w-[100px]" title={voto.note}>
                                    {voto.note}
                                  </span>
                                )}
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleEdit(voto)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Modifica completa"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(voto.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Elimina voto"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            )
                          ) : (
                            <button
                              onClick={() => handleCellClick(alunno.id, data)}
                              className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                              title="Aggiungi voto"
                            >
                              <Plus className="h-4 w-4 mx-auto" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Barra azioni modifica massiva */}
          {bulkEditMode && (
            <div className="bg-blue-50 border-t border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit2 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Modifica voti per {new Date(bulkEditMode).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveBulkEdit}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Salva Tutti</span>
                  </button>
                  <button
                    onClick={handleCancelBulkEdit}
                    className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Annulla</span>
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                💡 Modifica tutti i voti per questa data. Lascia vuoto per rimuovere un voto esistente.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Aggiungi Voto */}
      {showAddVotoModal && (
        <AddVotoModal
          alunno={alunni.find(a => a.id === showAddVotoModal.alunnoId)}
          data={showAddVotoModal.data}
          onSave={handleAddNewVoto}
          onCancel={() => setShowAddVotoModal(null)}
        />
      )}

      {/* Modal Conferma Eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Conferma Eliminazione</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo voto? Questa azione non può essere annullata.
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
// Componente Modal per aggiungere nuovo voto
interface AddVotoModalProps {
  alunno?: Alunno;
  data: string;
  onSave: (formData: {
    valore: ValutazioneType;
    note: string;
    isVerifica: boolean;
    numeroDomande: number;
    risposteEsatte: number;
  }) => void;
  onCancel: () => void;
}

function AddVotoModal({ alunno, data, onSave, onCancel }: AddVotoModalProps) {
  const [formData, setFormData] = useState({
    valore: 'sufficiente' as ValutazioneType,
    note: '',
    isVerifica: false,
    numeroDomande: 10,
    risposteEsatte: 6
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getVotoColorClass = (valore: ValutazioneType) => {
    const colors = {
      'ottimo': 'bg-green-100 text-green-800',
      'distinto': 'bg-blue-100 text-blue-800',
      'buono': 'bg-cyan-100 text-cyan-800',
      'discreto': 'bg-yellow-100 text-yellow-800',
      'sufficiente': 'bg-orange-100 text-orange-800',
      'non-sufficiente': 'bg-red-100 text-red-800'
    };
    return colors[valore] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          Aggiungi Voto - {alunno?.cognome} {alunno?.nome}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Data: {new Date(data).toLocaleDateString('it-IT')}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="isVerificaAdd"
              checked={formData.isVerifica}
              onChange={(e) => setFormData({ ...formData, isVerifica: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isVerificaAdd" className="text-sm font-medium text-gray-700">
              È una verifica
            </label>
          </div>

          {formData.isVerifica ? (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numero Domande
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.numeroDomande}
                    onChange={(e) => setFormData({ ...formData, numeroDomande: Number(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risposte Esatte
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.numeroDomande}
                    value={formData.risposteEsatte}
                    onChange={(e) => {
                      const risposte = Number(e.target.value);
                      const votoCalcolato = calcolaVotoVerifica(risposte, formData.numeroDomande);
                      setFormData({ 
                        ...formData, 
                        risposteEsatte: risposte,
                        valore: votoCalcolato
                      });
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Voto calcolato: </span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getVotoColorClass(formData.valore)}`}>
                  {VALUTAZIONI[formData.valore].label}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  ({Math.round((formData.risposteEsatte / formData.numeroDomande) * 100)}%)
                </span>
                <div className="text-xs text-gray-400 mt-1">
                  Sufficienza da {Math.ceil(formData.numeroDomande / 2)} risposte esatte
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voto</label>
              <select
                value={formData.valore}
                onChange={(e) => setFormData({ ...formData, valore: e.target.value as ValutazioneType })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(VALUTAZIONI).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label} ({val.valore})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Salva Voto
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}