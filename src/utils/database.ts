import { Alunno, Classe, Materia, Voto } from '../types';

class IndexedDBManager {
  private dbName = 'registro-voti-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crea store per classi
        if (!db.objectStoreNames.contains('classi')) {
          const classiStore = db.createObjectStore('classi', { keyPath: 'id' });
          classiStore.createIndex('nome', 'nome', { unique: false });
        }

        // Crea store per materie
        if (!db.objectStoreNames.contains('materie')) {
          const materieStore = db.createObjectStore('materie', { keyPath: 'id' });
          materieStore.createIndex('nome', 'nome', { unique: false });
        }

        // Crea store per alunni
        if (!db.objectStoreNames.contains('alunni')) {
          const alunniStore = db.createObjectStore('alunni', { keyPath: 'id' });
          alunniStore.createIndex('classeId', 'classeId', { unique: false });
          alunniStore.createIndex('cognome', 'cognome', { unique: false });
        }

        // Crea store per voti
        if (!db.objectStoreNames.contains('voti')) {
          const votiStore = db.createObjectStore('voti', { keyPath: 'id' });
          votiStore.createIndex('alunnoId', 'alunnoId', { unique: false });
          votiStore.createIndex('materiaId', 'materiaId', { unique: false });
          votiStore.createIndex('classeId', 'classeId', { unique: false });
          votiStore.createIndex('quadrimestre', 'quadrimestre', { unique: false });
          votiStore.createIndex('data', 'data', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async add<T>(storeName: string, item: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async update<T>(storeName: string, item: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async seedDefaultData(): Promise<void> {
    const classi = await this.getClassi();
    
    if (classi.length === 0) {
      // Inserisci dati di esempio
      const classiDefault: Classe[] = [
        { id: '1', nome: '1A', anno: '2024/2025' },
        { id: '2', nome: '2B', anno: '2024/2025' },
        { id: '3', nome: '3C', anno: '2024/2025' }
      ];

      const materieDefault: Materia[] = [
        { id: '1', nome: 'Italiano', descrizione: 'Lingua e letteratura italiana' },
        { id: '2', nome: 'Matematica', descrizione: 'Matematica e geometria' },
        { id: '3', nome: 'Storia', descrizione: 'Storia e geografia' },
        { id: '4', nome: 'Scienze', descrizione: 'Scienze naturali e sperimentali' },
        { id: '5', nome: 'Arte', descrizione: 'Arte e immagine' },
        { id: '6', nome: 'Musica', descrizione: 'Educazione musicale' },
        { id: '7', nome: 'Educazione Fisica', descrizione: 'Educazione fisica e sportiva' }
      ];

      for (const classe of classiDefault) {
        await this.updateClasse(classe);
      }

      for (const materia of materieDefault) {
        await this.updateMateria(materia);
      }
    }
  }

  // CRUD Classi
  async getClassi(): Promise<Classe[]> {
    const classi = await this.getAll<Classe>('classi');
    return classi.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async addClasse(classe: Classe): Promise<void> {
    await this.add('classi', classe);
  }

  async updateClasse(classe: Classe): Promise<void> {
    await this.update('classi', classe);
  }

  async deleteClasse(id: string): Promise<void> {
    // Elimina prima gli alunni e i voti associati
    const alunni = await this.getByIndex<Alunno>('alunni', 'classeId', id);
    for (const alunno of alunni) {
      await this.deleteAlunno(alunno.id);
    }
    
    const voti = await this.getByIndex<Voto>('voti', 'classeId', id);
    for (const voto of voti) {
      await this.delete('voti', voto.id);
    }
    
    await this.delete('classi', id);
  }

  // CRUD Materie
  async getMaterie(): Promise<Materia[]> {
    const materie = await this.getAll<Materia>('materie');
    return materie.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async addMateria(materia: Materia): Promise<void> {
    await this.add('materie', materia);
  }

  async updateMateria(materia: Materia): Promise<void> {
    await this.update('materie', materia);
  }

  async deleteMateria(id: string): Promise<void> {
    // Elimina prima i voti associati
    const voti = await this.getByIndex<Voto>('voti', 'materiaId', id);
    for (const voto of voti) {
      await this.delete('voti', voto.id);
    }
    
    await this.delete('materie', id);
  }

  // CRUD Alunni
  async getAlunni(): Promise<Alunno[]> {
    const alunni = await this.getAll<Alunno>('alunni');
    return alunni.sort((a, b) => `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`));
  }

  async addAlunno(alunno: Alunno): Promise<void> {
    await this.add('alunni', alunno);
  }

  async updateAlunno(alunno: Alunno): Promise<void> {
    await this.update('alunni', alunno);
  }

  async deleteAlunno(id: string): Promise<void> {
    // Elimina prima i voti associati
    const voti = await this.getByIndex<Voto>('voti', 'alunnoId', id);
    for (const voto of voti) {
      await this.delete('voti', voto.id);
    }
    
    await this.delete('alunni', id);
  }

  // CRUD Voti
  async getVoti(): Promise<Voto[]> {
    const voti = await this.getAll<Voto>('voti');
    return voti.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  async addVoto(voto: Voto): Promise<void> {
    await this.add('voti', voto);
  }

  async addVotiMultipli(voti: Voto[]): Promise<void> {
    for (const voto of voti) {
      await this.addVoto(voto);
    }
  }

  async updateVoto(voto: Voto): Promise<void> {
    await this.update('voti', voto);
  }

  async deleteVoto(id: string): Promise<void> {
    await this.delete('voti', id);
  }

  // Query avanzate
  async getVotiByClasse(classeId: string): Promise<Voto[]> {
    const voti = await this.getByIndex<Voto>('voti', 'classeId', classeId);
    return voti.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  async getVotiByAlunno(alunnoId: string): Promise<Voto[]> {
    const voti = await this.getByIndex<Voto>('voti', 'alunnoId', alunnoId);
    return voti.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  async getStatisticheMateria(materiaId: string): Promise<any> {
    const voti = await this.getByIndex<Voto>('voti', 'materiaId', materiaId);
    const totale = voti.length;
    
    if (totale === 0) return [];
    
    const conteggi: { [key: string]: number } = {};
    const valori = ['ottimo', 'distinto', 'buono', 'discreto', 'sufficiente', 'non-sufficiente'];
    
    valori.forEach(valore => conteggi[valore] = 0);
    voti.forEach(voto => conteggi[voto.valore]++);
    
    return valori.map(valore => ({
      valore,
      count: conteggi[valore],
      percentage: Math.round((conteggi[valore] / totale) * 100 * 100) / 100
    }));
  }

  // Backup e ripristino
  async exportData(): Promise<string> {
    const data = {
      classi: await this.getClassi(),
      materie: await this.getMaterie(),
      alunni: await this.getAlunni(),
      voti: await this.getVoti(),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  async exportVotiOnly(): Promise<string> {
    const data = {
      voti: await this.getVoti(),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  async importVotiOnly(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    if (data.voti && Array.isArray(data.voti)) {
      for (const voto of data.voti) {
        await this.addVoto(voto);
      }
    } else {
      throw new Error('Formato dati non valido per importazione voti');
    }
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    if (!data.classi && !data.materie && !data.alunni && !data.voti) {
      throw new Error('Formato dati non valido per importazione completa');
    }
    
    // Pulisci database esistente
    await this.clearAllData();
    
    // Importa nuovi dati
    if (data.classi) {
      for (const classe of data.classi) {
        await this.updateClasse(classe);
      }
    }
    
    if (data.materie) {
      for (const materia of data.materie) {
        await this.updateMateria(materia);
      }
    }
    
    if (data.alunni) {
      for (const alunno of data.alunni) {
        await this.updateAlunno(alunno);
      }
    }
    
    if (data.voti) {
      for (const voto of data.voti) {
        await this.updateVoto(voto);
      }
    }
  }

  private async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = ['voti', 'alunni', 'materie', 'classi'];
    
    for (const storeName of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }

  async initialize(): Promise<void> {
    await this.init();
    await this.seedDefaultData();
  }
}

// Singleton instance
export const database = new IndexedDBManager();
export default database;