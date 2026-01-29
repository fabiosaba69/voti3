import * as XLSX from 'xlsx';
import { Alunno, Classe, Materia, Voto, MediaCalcolata, VALUTAZIONI } from '../types';

export interface ExcelReportData {
  classi: Classe[];
  materie: Materia[];
  alunni: Alunno[];
  voti: Voto[];
  medie: MediaCalcolata[];
}

// Funzione per esportare registro classe in Excel
export function esportaRegistroClasseExcel(
  data: ExcelReportData,
  classeId: string,
  materiaId: string,
  quadrimestre: 1 | 2
) {
  const classe = data.classi.find(c => c.id === classeId);
  const materia = data.materie.find(m => m.id === materiaId);
  const alunni = data.alunni.filter(a => a.classeId === classeId);
  const voti = data.voti.filter(v => 
    v.classeId === classeId && 
    v.materiaId === materiaId && 
    v.quadrimestre === quadrimestre
  );

  if (!classe || !materia) return;

  // Crea workbook
  const wb = XLSX.utils.book_new();

  // Informazioni generali
  const infoData = [
    ['REGISTRO VOTI CLASSE'],
    [''],
    ['Classe:', classe.nome],
    ['Anno Scolastico:', classe.anno],
    ['Materia:', materia.nome],
    ['Quadrimestre:', `${quadrimestre}°`],
    ['Numero Alunni:', alunni.length],
    ['Totale Voti:', voti.length],
    ['Data Generazione:', new Date().toLocaleDateString('it-IT')],
    [''],
    ['© 2025 Fabio Sabatelli - Sistema di Gestione Registro Scolastico'],
    ['']
  ];

  // Prepara dati per la tabella voti
  const dateUniche = Array.from(new Set(voti.map(v => v.data))).sort();
  
  if (dateUniche.length > 0) {
    // Header tabella
    const headerRow = ['Alunno', ...dateUniche.map(d => new Date(d).toLocaleDateString('it-IT'))];
    infoData.push(headerRow);

    // Righe alunni
    alunni.forEach(alunno => {
      const row = [`${alunno.cognome} ${alunno.nome}`];
      
      dateUniche.forEach(data => {
        const voto = voti.find(v => v.alunnoId === alunno.id && v.data === data);
        if (voto) {
          let cellValue = VALUTAZIONI[voto.valore].label;
          if (voto.note) cellValue += ` (${voto.note})`;
          if (voto.tipoVerifica) cellValue += ` [${voto.tipoVerifica.risposteEsatte}/${voto.tipoVerifica.numeroDomande}]`;
          row.push(cellValue);
        } else {
          row.push('-');
        }
      });
      
      infoData.push(row);
    });

    // Legenda
    infoData.push(['']);
    infoData.push(['LEGENDA VALUTAZIONI:']);
    Object.entries(VALUTAZIONI).forEach(([key, val]) => {
      infoData.push([`${val.label} (${val.valore})`]);
    });
  } else {
    infoData.push(['Nessun voto presente per il periodo selezionato']);
  }

  // Crea worksheet
  const ws = XLSX.utils.aoa_to_sheet(infoData);

  // Stile celle (larghezza colonne)
  const colWidths = [
    { wch: 25 }, // Alunno
    ...dateUniche.map(() => ({ wch: 15 })) // Date
  ];
  ws['!cols'] = colWidths;

  // Aggiungi worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Registro Voti');

  // Salva file
  XLSX.writeFile(wb, `Registro_${classe.nome}_${materia.nome}_Q${quadrimestre}.xlsx`);
}

// Funzione per esportare scheda alunno in Excel
export function esportaSchedaAlunnoExcel(
  data: ExcelReportData,
  alunnoId: string
) {
  const alunno = data.alunni.find(a => a.id === alunnoId);
  const classe = data.classi.find(c => c.id === alunno?.classeId);
  const votiAlunno = data.voti.filter(v => v.alunnoId === alunnoId);
  const medieAlunno = data.medie.filter(m => m.alunnoId === alunnoId);

  if (!alunno || !classe) return;

  const wb = XLSX.utils.book_new();

  // Informazioni alunno
  const infoData = [
    ['SCHEDA INDIVIDUALE ALUNNO'],
    [''],
    ['Nome Completo:', `${alunno.nome} ${alunno.cognome}`],
    ['Classe:', classe.nome],
    ['Anno Scolastico:', classe.anno],
    ['Data di Nascita:', alunno.dataNascita ? new Date(alunno.dataNascita).toLocaleDateString('it-IT') : '-'],
    ['Totale Voti:', votiAlunno.length],
    ['Materie con Voti:', new Set(votiAlunno.map(v => v.materiaId)).size],
    [''],
    ['© 2025 Fabio Sabatelli - Sistema di Gestione Registro Scolastico'],
    ['']
  ];

  // Per ogni materia
  data.materie.forEach(materia => {
    const votiMateria = votiAlunno.filter(v => v.materiaId === materia.id);
    const mediaMateria = medieAlunno.find(m => m.materiaId === materia.id);
    
    if (votiMateria.length === 0 && !mediaMateria) return;

    infoData.push([`MATERIA: ${materia.nome.toUpperCase()}`]);
    infoData.push(['']);

    // Voti per quadrimestre
    [1, 2].forEach(quadrimestre => {
      const votiQuad = votiMateria.filter(v => v.quadrimestre === quadrimestre);
      
      if (votiQuad.length > 0) {
        infoData.push([`${quadrimestre}° Quadrimestre:`]);
        infoData.push(['Data', 'Voto', 'Note', 'Verifica']);
        
        votiQuad.forEach(v => {
          infoData.push([
            new Date(v.data).toLocaleDateString('it-IT'),
            VALUTAZIONI[v.valore].label,
            v.note || '-',
            v.tipoVerifica ? `${v.tipoVerifica.risposteEsatte}/${v.tipoVerifica.numeroDomande}` : '-'
          ]);
        });
        infoData.push(['']);
      }
    });

    // Medie
    if (mediaMateria) {
      infoData.push(['MEDIE:']);
      infoData.push(['1° Quadrimestre', '2° Quadrimestre', 'Media Finale']);
      infoData.push([
        mediaMateria.quadrimestre1 ? VALUTAZIONI[mediaMateria.quadrimestre1].label : '-',
        mediaMateria.quadrimestre2 ? VALUTAZIONI[mediaMateria.quadrimestre2].label : '-',
        mediaMateria.mediaFinale ? VALUTAZIONI[mediaMateria.mediaFinale].label : '-'
      ]);
      infoData.push(['']);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(infoData);
  ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Scheda Alunno');
  XLSX.writeFile(wb, `Scheda_${alunno.cognome}_${alunno.nome}.xlsx`);
}

// Funzione per esportare statistiche classe in Excel
export function esportaStatisticheClasseExcel(
  data: ExcelReportData,
  classeId: string
) {
  const classe = data.classi.find(c => c.id === classeId);
  const alunni = data.alunni.filter(a => a.classeId === classeId);
  const voti = data.voti.filter(v => v.classeId === classeId);
  const medie = data.medie.filter(m => 
    alunni.some(a => a.id === m.alunnoId)
  );

  if (!classe) return;

  const wb = XLSX.utils.book_new();

  // Statistiche generali
  const statsData = [
    ['STATISTICHE CLASSE'],
    [''],
    ['Classe:', classe.nome],
    ['Anno Scolastico:', classe.anno],
    ['Numero Alunni:', alunni.length],
    ['Totale Voti:', voti.length],
    ['Materie Attive:', data.materie.length],
    ['Media Voti per Alunno:', alunni.length > 0 ? Math.round(voti.length / alunni.length) : 0],
    ['Ultimo Aggiornamento:', new Date().toLocaleDateString('it-IT')],
    [''],
    ['© 2025 Fabio Sabatelli - Sistema di Gestione Registro Scolastico'],
    ['']
  ];

  // Statistiche per materia
  data.materie.forEach(materia => {
    const votiMateria = voti.filter(v => v.materiaId === materia.id);
    
    if (votiMateria.length === 0) return;

    statsData.push([`STATISTICHE ${materia.nome.toUpperCase()}:`]);
    statsData.push(['Valutazione', 'Numero Voti', 'Percentuale']);

    Object.keys(VALUTAZIONI).forEach(voto => {
      const count = votiMateria.filter(v => v.valore === voto).length;
      const percentage = votiMateria.length > 0 ? ((count / votiMateria.length) * 100).toFixed(1) : '0';
      statsData.push([
        VALUTAZIONI[voto as keyof typeof VALUTAZIONI].label,
        count,
        `${percentage}%`
      ]);
    });
    statsData.push(['']);
  });

  // Medie finali per alunno
  statsData.push(['MEDIE FINALI PER ALUNNO:']);
  const headerMedie = ['Alunno', ...data.materie.map(m => m.nome)];
  statsData.push(headerMedie);

  alunni.forEach(alunno => {
    const row = [`${alunno.cognome} ${alunno.nome}`];
    
    data.materie.forEach(materia => {
      const media = medie.find(m => m.alunnoId === alunno.id && m.materiaId === materia.id);
      row.push(media?.mediaFinale ? VALUTAZIONI[media.mediaFinale].label : '-');
    });
    
    statsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(statsData);
  ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Statistiche');
  XLSX.writeFile(wb, `Statistiche_Classe_${classe.nome}.xlsx`);
}

// Funzione per esportare tutti i dati in Excel
export function esportaDatiCompletiExcel(data: ExcelReportData) {
  const wb = XLSX.utils.book_new();

  // Sheet Classi
  const classiData = [
    ['CLASSI'],
    ['ID', 'Nome', 'Anno Scolastico'],
    ...data.classi.map(c => [c.id, c.nome, c.anno])
  ];
  const wsClassi = XLSX.utils.aoa_to_sheet(classiData);
  XLSX.utils.book_append_sheet(wb, wsClassi, 'Classi');

  // Sheet Materie
  const materieData = [
    ['MATERIE'],
    ['ID', 'Nome', 'Descrizione'],
    ...data.materie.map(m => [m.id, m.nome, m.descrizione])
  ];
  const wsMaterie = XLSX.utils.aoa_to_sheet(materieData);
  XLSX.utils.book_append_sheet(wb, wsMaterie, 'Materie');

  // Sheet Alunni
  const alunniData = [
    ['ALUNNI'],
    ['ID', 'Nome', 'Cognome', 'Data Nascita', 'Classe'],
    ...data.alunni.map(a => {
      const classe = data.classi.find(c => c.id === a.classeId);
      return [
        a.id, 
        a.nome, 
        a.cognome, 
        a.dataNascita ? new Date(a.dataNascita).toLocaleDateString('it-IT') : '-',
        classe ? classe.nome : '-'
      ];
    })
  ];
  const wsAlunni = XLSX.utils.aoa_to_sheet(alunniData);
  XLSX.utils.book_append_sheet(wb, wsAlunni, 'Alunni');

  // Sheet Voti
  const votiData = [
    ['VOTI'],
    ['ID', 'Alunno', 'Materia', 'Classe', 'Voto', 'Data', 'Quadrimestre', 'Note'],
    ...data.voti.map(v => {
      const alunno = data.alunni.find(a => a.id === v.alunnoId);
      const materia = data.materie.find(m => m.id === v.materiaId);
      const classe = data.classi.find(c => c.id === v.classeId);
      return [
        v.id,
        alunno ? `${alunno.cognome} ${alunno.nome}` : '-',
        materia ? materia.nome : '-',
        classe ? classe.nome : '-',
        VALUTAZIONI[v.valore].label,
        new Date(v.data).toLocaleDateString('it-IT'),
        `${v.quadrimestre}°`,
        v.note || '-'
      ];
    })
  ];
  const wsVoti = XLSX.utils.aoa_to_sheet(votiData);
  XLSX.utils.book_append_sheet(wb, wsVoti, 'Voti');

  // Sheet Medie
  const medieData = [
    ['MEDIE'],
    ['Alunno', 'Materia', '1° Quadrimestre', '2° Quadrimestre', 'Media Finale'],
    ...data.medie.map(m => {
      const alunno = data.alunni.find(a => a.id === m.alunnoId);
      const materia = data.materie.find(mat => mat.id === m.materiaId);
      return [
        alunno ? `${alunno.cognome} ${alunno.nome}` : '-',
        materia ? materia.nome : '-',
        m.quadrimestre1 ? VALUTAZIONI[m.quadrimestre1].label : '-',
        m.quadrimestre2 ? VALUTAZIONI[m.quadrimestre2].label : '-',
        m.mediaFinale ? VALUTAZIONI[m.mediaFinale].label : '-'
      ];
    })
  ];
  const wsMedie = XLSX.utils.aoa_to_sheet(medieData);
  XLSX.utils.book_append_sheet(wb, wsMedie, 'Medie');

  // Salva file
  XLSX.writeFile(wb, `Registro_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
}