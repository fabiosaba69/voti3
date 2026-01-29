import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Classe, Materia, Alunno, Voto, MediaCalcolata, ValutazioneType, VALUTAZIONI } from '../types';
import { database } from '../utils/database';

interface AppContextType {
  // Dati
  classi: Classe[];
  materie: Materia[];
  alunni: Alunno[];
  voti: Voto[];
  medie: MediaCalcolata[];
  
  // Selezioni correnti
  selectedClasse: Classe | null;
  selectedMateria: Materia | null;
  classeSelezionata: string | null;
  materiaSelezionata: string | null;
  
  // Stato di caricamento
  isLoading: boolean;
  
  // Funzioni per gestire le classi
  addClasse: (classe: Classe) => Promise<void>;
  updateClasse: (classe: Classe) => Promise<void>;
  deleteClasse: (id: string) => Promise<void>;
  setSelectedClasse: (classe: Classe | null) => void;
  
  // Funzioni per gestire le materie
  addMateria: (materia: Materia) => Promise<void>;
  updateMateria: (materia: Materia) => Promise<void>;
  deleteMateria: (id: string) => Promise<void>;
  setSelectedMateria: (materia: Materia | null) => void;
  
  // Funzioni per gestire gli alunni
  addAlunno: (alunno: Alunno) => Promise<void>;
  updateAlunno: (alunno: Alunno) => Promise<void>;
  deleteAlunno: (id: string) => Promise<void>;
  
  // Funzioni per gestire i voti
  addVoto: (voto: Voto) => Promise<void>;
  addVotiMultipli: (voti: Voto[]) => Promise<void>;
  updateVoto: (voto: Voto) => Promise<void>;
  deleteVoto: (id: string) => Promise<void>;
  
  // Funzioni per selezioni
  setClasseSelezionata: (classeId: string | null) => void;
  setMateriaSelezionata: (materiaId: string | null) => void;
  
  // Utility
  reloadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Funzioni helper per calcolo medie
const getValoreNumerico = (valutazione: ValutazioneType): number => {
  const valori = {
    'ottimo': 10,
    'distinto': 9,
    'buono': 8,
    'discreto': 7,
    'sufficiente': 6,
    'non-sufficiente': 4
  };
  return valori[valutazione];
};

const getValutazioneFromNumero = (numero: number): ValutazioneType => {
  if (numero >= 9.5) return 'ottimo';
  if (numero >= 8.5) return 'distinto';
  if (numero >= 7.5) return 'buono';
  if (numero >= 6.5) return 'discreto';
  if (numero >= 6) return 'sufficiente';
  return 'non-sufficiente';
};

const calculateAverageGrade = (voti: Voto[]): ValutazioneType | undefined => {
  if (voti.length === 0) return undefined;
  
  const somma = voti.reduce((acc, voto) => acc + getValoreNumerico(voto.valore), 0);
  const media = somma / voti.length;
  
  return getValutazioneFromNumero(media);
};
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [classi, setClassi] = useState<Classe[]>([]);
  const [materie, setMaterie] = useState<Materia[]>([]);
  const [alunni, setAlunni] = useState<Alunno[]>([]);
  const [voti, setVoti] = useState<Voto[]>([]);
  const [medie, setMedie] = useState<MediaCalcolata[]>([]);
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [classeSelezionata, setClasseSelezionata] = useState<string | null>(null);
  const [materiaSelezionata, setMateriaSelezionata] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calcola tutte le medie
  const calculateAllMedie = () => {
    const medieCalcolate: MediaCalcolata[] = [];
    
    alunni.forEach(alunno => {
      materie.forEach(materia => {
        const votiAlunnoMateria = voti.filter(v => 
          v.alunnoId === alunno.id && v.materiaId === materia.id
        );
        
        const votiQ1 = votiAlunnoMateria.filter(v => v.quadrimestre === 1);
        const votiQ2 = votiAlunnoMateria.filter(v => v.quadrimestre === 2);
        
        const mediaQ1 = calculateAverageGrade(votiQ1);
        const mediaQ2 = calculateAverageGrade(votiQ2);
        
        let mediaFinale: ValutazioneType | undefined;
        if (mediaQ1 && mediaQ2) {
          const valoreQ1 = getValoreNumerico(mediaQ1);
          const valoreQ2 = getValoreNumerico(mediaQ2);
          const mediaNum = (valoreQ1 + valoreQ2) / 2;
          mediaFinale = getValutazioneFromNumero(mediaNum);
        } else if (mediaQ1) {
          mediaFinale = mediaQ1;
        } else if (mediaQ2) {
          mediaFinale = mediaQ2;
        }
        
        if (mediaQ1 || mediaQ2 || mediaFinale) {
          medieCalcolate.push({
            alunnoId: alunno.id,
            materiaId: materia.id,
            quadrimestre1: mediaQ1,
            quadrimestre2: mediaQ2,
            mediaFinale
          });
        }
      });
    });
    
    setMedie(medieCalcolate);
  };

  // Ricalcola le medie quando cambiano voti, alunni o materie
  useEffect(() => {
    if (!isLoading) {
      calculateAllMedie();
    }
  }, [voti, alunni, materie, isLoading]);
  // Inizializza il database e carica i dati
  const loadData = async () => {
    try {
      setIsLoading(true);
      await database.initialize();
      
      const [classiData, materieData, alunniData, votiData] = await Promise.all([
        database.getClassi(),
        database.getMaterie(),
        database.getAlunni(),
        database.getVoti()
      ]);
      
      setClassi(classiData);
      setMaterie(materieData);
      setAlunni(alunniData);
      setVoti(votiData);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Funzioni per gestire le classi
  const addClasse = async (classe: Classe) => {
    await database.addClasse(classe);
    setClassi(await database.getClassi());
  };

  const updateClasse = async (classe: Classe) => {
    await database.updateClasse(classe);
    setClassi(await database.getClassi());
  };

  const deleteClasse = async (id: string) => {
    await database.deleteClasse(id);
    const [classiData, alunniData, votiData] = await Promise.all([
      database.getClassi(),
      database.getAlunni(),
      database.getVoti()
    ]);
    setClassi(classiData);
    setAlunni(alunniData);
    setVoti(votiData);
    
    // Reset selezioni se necessario
    if (selectedClasse?.id === id) {
      setSelectedClasse(null);
    }
    if (classeSelezionata === id) {
      setClasseSelezionata(null);
    }
  };

  // Funzioni per gestire le materie
  const addMateria = async (materia: Materia) => {
    await database.addMateria(materia);
    setMaterie(await database.getMaterie());
  };

  const updateMateria = async (materia: Materia) => {
    await database.updateMateria(materia);
    setMaterie(await database.getMaterie());
  };

  const deleteMateria = async (id: string) => {
    await database.deleteMateria(id);
    const [materieData, votiData] = await Promise.all([
      database.getMaterie(),
      database.getVoti()
    ]);
    setMaterie(materieData);
    setVoti(votiData);
    
    // Reset selezioni se necessario
    if (selectedMateria?.id === id) {
      setSelectedMateria(null);
    }
    if (materiaSelezionata === id) {
      setMateriaSelezionata(null);
    }
  };

  // Funzioni per gestire gli alunni
  const addAlunno = async (alunno: Alunno) => {
    await database.addAlunno(alunno);
    setAlunni(await database.getAlunni());
  };

  const updateAlunno = async (alunno: Alunno) => {
    await database.updateAlunno(alunno);
    setAlunni(await database.getAlunni());
  };

  const deleteAlunno = async (id: string) => {
    await database.deleteAlunno(id);
    const [alunniData, votiData] = await Promise.all([
      database.getAlunni(),
      database.getVoti()
    ]);
    setAlunni(alunniData);
    setVoti(votiData);
  };

  // Funzioni per gestire i voti
  const addVoto = async (voto: Voto) => {
    await database.addVoto(voto);
    setVoti(await database.getVoti());
  };

  const addVotiMultipli = async (voti: Voto[]) => {
    await database.addVotiMultipli(voti);
    setVoti(await database.getVoti());
  };

  const updateVoto = async (voto: Voto) => {
    await database.updateVoto(voto);
    setVoti(await database.getVoti());
  };

  const deleteVoto = async (id: string) => {
    await database.deleteVoto(id);
    setVoti(await database.getVoti());
  };

  // Funzione per ricaricare i dati
  const reloadData = async () => {
    const [classiData, materieData, alunniData, votiData] = await Promise.all([
      database.getClassi(),
      database.getMaterie(),
      database.getAlunni(),
      database.getVoti()
    ]);
    setClassi(classiData);
    setMaterie(materieData);
    setAlunni(alunniData);
    setVoti(votiData);
  };

  const value: AppContextType = {
    classi,
    materie,
    alunni,
    voti,
    medie,
    selectedClasse,
    selectedMateria,
    classeSelezionata,
    materiaSelezionata,
    isLoading,
    addClasse,
    updateClasse,
    deleteClasse,
    setSelectedClasse,
    addMateria,
    updateMateria,
    deleteMateria,
    setSelectedMateria,
    addAlunno,
    updateAlunno,
    deleteAlunno,
    addVoto,
    addVotiMultipli,
    updateVoto,
    deleteVoto,
    setClasseSelezionata,
    setMateriaSelezionata,
    reloadData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};