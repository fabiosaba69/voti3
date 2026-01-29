import React from 'react';
import { FileDown, BarChart3 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { VALUTAZIONI } from '../types';
import { esportaSchedaAlunno, esportaStatisticheClasse } from '../utils/pdfExport';
import { esportaSchedaAlunnoExcel, esportaStatisticheClasseExcel } from '../utils/excelExport';

export default function MedieStatistiche() {
  const { 
    classi, 
    materie, 
    alunni, 
    voti, 
    medie, 
    classeSelezionata, 
    materiaSelezionata, 
    setClasseSelezionata, 
    setMateriaSelezionata 
  } = useApp();

  const getVotoColorClass = (valore: string) => {
    const colors = {
      'ottimo': 'bg-green-100 text-green-800',
      'distinto': 'bg-blue-100 text-blue-800',
      'buono': 'bg-cyan-100 text-cyan-800',
      'discreto': 'bg-yellow-100 text-yellow-800',
      'sufficiente': 'bg-orange-100 text-orange-800',
      'non-sufficiente': 'bg-red-100 text-red-800'
    };
    return colors[valore as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const alunniFiltrati = alunni.filter(a => 
    !classeSelezionata || a.classeId === classeSelezionata
  );

  const medieFiltrate = medie.filter(m =>
    (!classeSelezionata || alunniFiltrati.some(a => a.id === m.alunnoId)) &&
    (!materiaSelezionata || m.materiaId === materiaSelezionata)
  );

  const handleEsportaSchedaAlunno = (alunnoId: string) => {
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

  const handleEsportaStatisticheClasse = () => {
    if (!classeSelezionata) {
      alert('Seleziona una classe per esportare le statistiche.');
      return;
    }

    esportaStatisticheClasse(
      {
        classi,
        materie,
        alunni,
        voti,
        medie
      },
      classeSelezionata
    );
  };

  const handleEsportaStatisticheClasseExcel = () => {
    if (!classeSelezionata) {
      alert('Seleziona una classe per esportare le statistiche.');
      return;
    }

    esportaStatisticheClasseExcel(
      {
        classi,
        materie,
        alunni,
        voti,
        medie
      },
      classeSelezionata
    );
  };

  const handleEsportaSchedaAlunnoExcel = (alunnoId: string) => {
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
        <h2 className="text-2xl font-bold text-gray-800">Medie e Statistiche</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleEsportaStatisticheClasse}
            disabled={!classeSelezionata}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Statistiche PDF</span>
          </button>
          <button
            onClick={handleEsportaStatisticheClasseExcel}
            disabled={!classeSelezionata}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Statistiche Excel</span>
          </button>
        </div>
      </div>

      {/* Selezione Classe e Materia */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classe</label>
          <select
            value={classeSelezionata || ''}
            onChange={(e) => setClasseSelezionata(e.target.value || null)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutte le classi</option>
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
            <option value="">Tutte le materie</option>
            {materie.map((materia) => (
              <option key={materia.id} value={materia.id}>
                {materia.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabella Medie */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alunno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Materia
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                1° Quadrimestre
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                2° Quadrimestre
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Media Finale
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medieFiltrate.map((media) => {
              const alunno = alunni.find(a => a.id === media.alunnoId);
              const materia = materie.find(m => m.id === media.materiaId);
              
              if (!alunno || !materia) return null;

              return (
                <tr key={`${media.alunnoId}-${media.materiaId}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {alunno.cognome} {alunno.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {materia.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {media.quadrimestre1 ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getVotoColorClass(media.quadrimestre1)}`}>
                        {VALUTAZIONI[media.quadrimestre1].label}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {media.quadrimestre2 ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getVotoColorClass(media.quadrimestre2)}`}>
                        {VALUTAZIONI[media.quadrimestre2].label}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {media.mediaFinale ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getVotoColorClass(media.mediaFinale)}`}>
                        {VALUTAZIONI[media.mediaFinale].label}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleEsportaSchedaAlunno(alunno.id)}
                      className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <FileDown className="h-3 w-3" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleEsportaSchedaAlunnoExcel(alunno.id)}
                      className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors mx-auto mt-1"
                    >
                      <FileDown className="h-3 w-3" />
                      <span>Excel</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {medieFiltrate.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nessuna media disponibile per i criteri selezionati.</p>
        </div>
      )}
    </div>
  );
}