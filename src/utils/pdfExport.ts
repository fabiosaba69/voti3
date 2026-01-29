import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Alunno, Classe, Materia, Voto, MediaCalcolata, VALUTAZIONI } from '../types';

export interface ReportData {
  classi: Classe[];
  materie: Materia[];
  alunni: Alunno[];
  voti: Voto[];
  medie: MediaCalcolata[];
}

// Funzione per aggiungere header standard
function addHeader(doc: jsPDF, title: string, subtitle?: string, pageWidth: number = 297) {
  // Logo/Icona (simulata con testo)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Blue-600
  doc.text('REGISTRO SCOLASTICO', 15, 15);
  
  // Titolo principale
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55); // Gray-800
  doc.text(title, pageWidth / 2, 30, { align: 'center' });
  
  // Sottotitolo se presente
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.text(subtitle, pageWidth / 2, 40, { align: 'center' });
  }
  
  // Linea separatrice
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.setLineWidth(0.5);
  doc.line(15, 45, pageWidth - 15, 45);
}

// Funzione per aggiungere footer con copyright
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number, pageWidth: number = 297, pageHeight: number = 210) {
  const footerY = pageHeight - 15;
  
  // Linea separatrice
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.setLineWidth(0.3);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
  
  // Numero pagina a destra
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.text(`Pagina ${pageNumber} di ${totalPages}`, pageWidth - 15, footerY, { align: 'right' });
  
  // Data generazione al centro
  const dataGenerazione = new Date().toLocaleDateString('it-IT') + ' - ' + new Date().toLocaleTimeString('it-IT');
  doc.text(dataGenerazione, pageWidth / 2, footerY, { align: 'center' });
}

// Funzione per applicare footer a tutte le pagine
function applyFooterToAllPages(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  const pageFormat = doc.internal.pageSize;
  const pageWidth = pageFormat.width;
  const pageHeight = pageFormat.height;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages, pageWidth, pageHeight);
  }
}

export function esportaRegistroClasse(
  data: ReportData,
  classeId: string,
  materiaId: string,
  quadrimestre: 1 | 2
) {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  const classe = data.classi.find(c => c.id === classeId);
  const materia = data.materie.find(m => m.id === materiaId);
  const alunni = data.alunni.filter(a => a.classeId === classeId);
  const voti = data.voti.filter(v => 
    v.classeId === classeId && 
    v.materiaId === materiaId && 
    v.quadrimestre === quadrimestre
  );

  if (!classe || !materia) return;

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header
  addHeader(doc, 'REGISTRO VOTI CLASSE', classe.nome + ' - ' + materia.nome + ' - ' + quadrimestre + ' Quadrimestre', pageWidth);

  // Informazioni classe
  let currentY = 55;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  const info = [
    'Classe: ' + classe.nome,
    'Anno Scolastico: ' + classe.anno,
    'Materia: ' + materia.nome,
    'Quadrimestre: ' + quadrimestre,
    'Numero Alunni: ' + alunni.length,
    'Totale Voti: ' + voti.length
  ];
  
  info.forEach((text, index) => {
    const x = index % 2 === 0 ? 15 : pageWidth / 2 + 10;
    const y = currentY + Math.floor(index / 2) * 6;
    doc.text(text, x, y);
  });
  
  currentY += 25;

  // Prepara dati per la tabella
  const dateUniche = Array.from(new Set(voti.map(v => v.data))).sort();
  
  if (dateUniche.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68); // Red-500
    doc.text('Nessun voto presente per il periodo selezionato', pageWidth / 2, currentY + 20, { align: 'center' });
    applyFooterToAllPages(doc);
    doc.save(`Registro_${classe.nome}_${materia.nome}_Q${quadrimestre}.pdf`);
    return;
  }
  
  const headers = ['Alunno', ...dateUniche.map(d => new Date(d).toLocaleDateString('it-IT'))];
  
  const rows = alunni.map(alunno => {
    const row = [`${alunno.cognome} ${alunno.nome}`];
    
    dateUniche.forEach(data => {
      const voto = voti.find(v => v.alunnoId === alunno.id && v.data === data);
      if (voto) {
        const valutazione = VALUTAZIONI[voto.valore].label;
        const nota = voto.note ? ' (' + voto.note.substring(0, 20) + (voto.note.length > 20 ? '...' : '') + ')' : '';
        const verifica = voto.tipoVerifica ? ' [' + voto.tipoVerifica.risposteEsatte + '/' + voto.tipoVerifica.numeroDomande + ']' : '';
        row.push(valutazione + nota + verifica);
      } else {
        row.push('-');
      }
    });
    
    return row;
  });

  // Tabella principale
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: currentY,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { 
        cellWidth: 35, 
        fontStyle: 'bold',
        fillColor: [249, 250, 251]
      },
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index > 0) {
        const cellText = data.cell.text[0];
        if (cellText && cellText !== '-') {
          if (cellText.includes('Ottimo')) {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [22, 101, 52];
          } else if (cellText.includes('Distinto')) {
            data.cell.styles.fillColor = [219, 234, 254];
            data.cell.styles.textColor = [30, 64, 175];
          } else if (cellText.includes('Buono')) {
            data.cell.styles.fillColor = [207, 250, 254];
            data.cell.styles.textColor = [22, 78, 99];
          } else if (cellText.includes('Discreto')) {
            data.cell.styles.fillColor = [254, 249, 195];
            data.cell.styles.textColor = [161, 98, 7];
          } else if (cellText.includes('Sufficiente')) {
            data.cell.styles.fillColor = [255, 237, 213];
            data.cell.styles.textColor = [194, 65, 12];
          } else if (cellText.includes('Non Sufficiente')) {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [185, 28, 28];
          }
        }
      }
    },
    margin: { 
      top: currentY, 
      left: 15, 
      right: 15,
      bottom: 30
    },
    pageBreak: 'auto',
    showHead: 'everyPage',
  });

  // Legenda valutazioni
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY < pageHeight - 60) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Legenda Valutazioni:', 15, finalY);
    
    const legenda = [
      'Ottimo (10)', 'Distinto (9)', 'Buono (8)', 
      'Discreto (7)', 'Sufficiente (6)', 'Non Sufficiente (4)'
    ];
    
    legenda.forEach((item, index) => {
      const x = 15 + (index % 3) * 60;
      const y = finalY + 8 + Math.floor(index / 3) * 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${item}`, x, y);
    });
  }

  applyFooterToAllPages(doc);
  doc.save('Registro_' + classe.nome + '_' + materia.nome + '_Q' + quadrimestre + '.pdf');
}

export function esportaSchedaAlunno(
  data: ReportData,
  alunnoId: string
) {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  const alunno = data.alunni.find(a => a.id === alunnoId);
  const classe = data.classi.find(c => c.id === alunno?.classeId);
  const votiAlunno = data.voti.filter(v => v.alunnoId === alunnoId);
  const medieAlunno = data.medie.filter(m => m.alunnoId === alunnoId);

  if (!alunno || !classe) return;

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header
  addHeader(doc, 'SCHEDA INDIVIDUALE ALUNNO', alunno.nome + ' ' + alunno.cognome, pageWidth);

  // Informazioni alunno
  let currentY = 55;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  const infoAlunno = [
    'Nome Completo: ' + alunno.nome + ' ' + alunno.cognome,
    'Classe: ' + classe.nome,
    'Anno Scolastico: ' + classe.anno,
    alunno.dataNascita ? 'Data di Nascita: ' + new Date(alunno.dataNascita).toLocaleDateString('it-IT') : null,
    'Totale Voti: ' + votiAlunno.length,
    'Materie con Voti: ' + new Set(votiAlunno.map(v => v.materiaId)).size
  ].filter(Boolean);
  
  infoAlunno.forEach((text, index) => {
    if (text) {
      const x = index % 2 === 0 ? 15 : pageWidth / 2 + 10;
      const y = currentY + Math.floor(index / 2) * 6;
      doc.text(text, x, y);
    }
  });
  
  currentY += 25;

  // Per ogni materia
  data.materie.forEach(materia => {
    const votiMateria = votiAlunno.filter(v => v.materiaId === materia.id);
    const mediaMateria = medieAlunno.find(m => m.materiaId === materia.id);
    
    if (votiMateria.length === 0 && !mediaMateria) return;

    // Controlla se c'è spazio per la sezione
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 30;
    }

    // Titolo materia
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(materia.nome.toUpperCase(), 15, currentY);
    currentY += 8;

    // Voti per quadrimestre
    [1, 2].forEach(quadrimestre => {
      const votiQuad = votiMateria.filter(v => v.quadrimestre === quadrimestre);
      
      if (votiQuad.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(75, 85, 99);
        doc.text(quadrimestre + ' Quadrimestre:', 20, currentY);
        currentY += 6;

        const votiData = votiQuad.map(v => [
          new Date(v.data).toLocaleDateString('it-IT'),
          VALUTAZIONI[v.valore].label,
          v.note || '-',
          v.tipoVerifica ? v.tipoVerifica.risposteEsatte + '/' + v.tipoVerifica.numeroDomande : '-'
        ]);

        autoTable(doc, {
          head: [['Data', 'Voto', 'Note', 'Verifica']],
          body: votiData,
          startY: currentY,
          styles: {
            fontSize: 9,
            cellPadding: 2,
            lineColor: [229, 231, 235],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 80 },
            3: { cellWidth: 25 },
          },
          margin: { 
            left: 20, 
            right: 15,
            bottom: 30
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;
      }
    });

    // Medie
    if (mediaMateria) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(75, 85, 99);
      doc.text('Medie:', 20, currentY);
      currentY += 6;

      const medieData = [
        [
          mediaMateria.quadrimestre1 ? VALUTAZIONI[mediaMateria.quadrimestre1].label : '-',
          mediaMateria.quadrimestre2 ? VALUTAZIONI[mediaMateria.quadrimestre2].label : '-',
          mediaMateria.mediaFinale ? VALUTAZIONI[mediaMateria.mediaFinale].label : '-'
        ]
      ];

      autoTable(doc, {
        head: [['1° Quadrimestre', '2° Quadrimestre', 'Media Finale']],
        body: medieData,
        startY: currentY,
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { 
          left: 20, 
          right: 15,
          bottom: 30
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }
  });

  applyFooterToAllPages(doc);
  doc.save('Scheda_' + alunno.cognome + '_' + alunno.nome + '.pdf');
}

export function esportaStatisticheClasse(
  data: ReportData,
  classeId: string
) {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  const classe = data.classi.find(c => c.id === classeId);
  const alunni = data.alunni.filter(a => a.classeId === classeId);
  const voti = data.voti.filter(v => v.classeId === classeId);
  const medie = data.medie.filter(m => 
    alunni.some(a => a.id === m.alunnoId)
  );

  if (!classe) return;

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header
  addHeader(doc, 'STATISTICHE CLASSE', classe.nome + ' - Anno ' + classe.anno, pageWidth);

  // Statistiche generali
  let currentY = 55;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  
  const statsGenerali = [
    'Numero Alunni: ' + alunni.length,
    'Totale Voti: ' + voti.length,
    'Materie Attive: ' + data.materie.length,
    'Media Voti per Alunno: ' + (alunni.length > 0 ? Math.round(voti.length / alunni.length) : 0),
    'Periodo: ' + classe.anno,
    'Ultimo Aggiornamento: ' + new Date().toLocaleDateString('it-IT')
  ];
  
  statsGenerali.forEach((text, index) => {
    const x = index % 2 === 0 ? 15 : pageWidth / 2 + 10;
    const y = currentY + Math.floor(index / 2) * 6;
    doc.text(text, x, y);
  });
  
  currentY += 25;

  // Statistiche per materia
  data.materie.forEach(materia => {
    const votiMateria = voti.filter(v => v.materiaId === materia.id);
    const medieMateria = medie.filter(m => m.materiaId === materia.id);
    
    if (votiMateria.length === 0) return;

    // Controlla spazio disponibile
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 30;
    }

    // Titolo materia
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(materia.nome.toUpperCase(), 15, currentY);
    currentY += 8;

    // Calcola statistiche
    const statistiche = Object.keys(VALUTAZIONI).map(voto => {
      const count = votiMateria.filter(v => v.valore === voto).length;
      const percentage = votiMateria.length > 0 ? ((count / votiMateria.length) * 100).toFixed(1) : '0';
      return [
        VALUTAZIONI[voto as keyof typeof VALUTAZIONI].label, 
        count.toString(), 
        percentage + '%'
      ];
    });

    autoTable(doc, {
      head: [['Valutazione', 'Numero Voti', 'Percentuale']],
      body: statistiche,
      startY: currentY,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
      },
      margin: { 
        left: 15, 
        right: 15,
        bottom: 30
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  });

  // Tabella riassuntiva medie finali
  if (currentY > pageHeight - 120) {
    doc.addPage();
    currentY = 30;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('MEDIE FINALI PER ALUNNO', 15, currentY);
  currentY += 8;

  const medieFinaliData = alunni.map(alunno => {
    const row = [alunno.cognome + ' ' + alunno.nome];
    
    data.materie.forEach(materia => {
      const media = medie.find(m => m.alunnoId === alunno.id && m.materiaId === materia.id);
      row.push(media?.mediaFinale ? VALUTAZIONI[media.mediaFinale].label : '-');
    });
    
    return row;
  });

  const headersMedie = ['Alunno', ...data.materie.map(m => m.nome)];

  autoTable(doc, {
    head: [headersMedie],
    body: medieFinaliData,
    startY: currentY,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
    },
    margin: { 
      left: 15, 
      right: 15,
      bottom: 30
    },
    pageBreak: 'auto',
    showHead: 'everyPage',
  });

  applyFooterToAllPages(doc);
  doc.save('Statistiche_Classe_' + classe.nome + '.pdf');
}