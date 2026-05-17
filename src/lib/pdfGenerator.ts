import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { encryptData } from './crypto';

const MM_TO_PX = 3;

export const generateSKL = async (student: any, settings: any) => {
  // First, fetch custom template if available
  let templateConfig: any = null;
  try {
    const snap = await getDoc(doc(db, 'settings', 'template'));
    if (snap.exists()) {
      templateConfig = snap.data();
    }
  } catch (e) {
    console.error("Failed to load template", e);
  }

  const docPdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  const pageWidth = docPdf.internal.pageSize.getWidth();

  if (templateConfig && templateConfig.elements && templateConfig.elements.length > 0) {
    // ---- USE CUSTOM DRAG AND DROP TEMPLATE ----
    
    // 1. Draw Background Image
    if (templateConfig.backgroundUrl) {
      try {
        const resp = await fetch(templateConfig.backgroundUrl);
        const blob = await resp.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        docPdf.addImage(base64 as string, 'PNG', 0, 0, 210, 297);
      } catch (e) {
        console.error("Failed to load background image for PDF");
      }
    }

    // 2. Draw Elements
    for (const el of templateConfig.elements) {
      if (el.type === 'text') {
        let printText = el.text;
        // Variables replacement
        if (el.key === 'name') printText = student.name;
        if (el.key === 'nisn') printText = student.nisn;
        if (el.key === 'status') printText = student.status === 'LULUS' ? 'LULUS' : 'TIDAK LULUS';
        if (el.key === 'ttl') printText = `${student.birthPlace || '-'}, ${student.birthDate || '-'}`;

        docPdf.setFont('helvetica', 'bold');
        docPdf.setFontSize(el.size * (MM_TO_PX/0.352778)/3); // rough pt conversion
        docPdf.text(printText, el.x, el.y + (el.size / 3)); // y offset for baseline

      } else if (el.type === 'qr') {
        const verifyData = {
          id: student.id || student.nisn,
          n: student.name,
          s: student.status,
          sy: settings.schoolYear,
          ln: settings.letterNumber,
          pn: settings.principalName,
          pl: settings.printLocation,
          pd: settings.printDate,
          ts: Date.now()
        };
        const token = encryptData(verifyData);
        const verifyUrl = `https://panbitsignature.vercel.app/?data=${encodeURIComponent(token)}`;
        
        try {
          const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 300 });
          docPdf.addImage(qrDataUrl, 'PNG', el.x, el.y, el.size, el.size);
        } catch (e) {
          console.error("QR Generation failed");
        }
      }
    }

  } else {
    // ---- FALLBACK DEFAULT DESIGN ----
    let y = 20;

    // Header
    if (settings.logoUrl) {
      try {
        const resp = await fetch(settings.logoUrl);
        const blob = await resp.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        docPdf.addImage(base64 as string, 'PNG', 20, y, 20, 20);
      } catch (e) {
        console.error("Logo failed to load for PDF");
      }
    }

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(14);
    docPdf.text(settings.schoolName.toUpperCase(), pageWidth / 2 + 10, y + 8, { align: 'center' });
    docPdf.setFontSize(10);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text('SURAT KETERANGAN LULUS', pageWidth / 2 + 10, y + 14, { align: 'center' });
    docPdf.text(`Tahun Pelajaran ${settings.schoolYear}`, pageWidth / 2 + 10, y + 19, { align: 'center' });
    
    y += 30;
    docPdf.setLineWidth(0.5);
    docPdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    docPdf.setFontSize(11);
    docPdf.text(`Nomor: ${settings.letterNumber || '...'}`, margin, y);
    y += 10;

    const content = `Yang bertanda tangan di bawah ini, Kepala ${settings.schoolName} menerangkan bahwa:`;
    const splitContent = docPdf.splitTextToSize(content, pageWidth - 2 * margin);
    docPdf.text(splitContent, margin, y);
    y += 15;

    const details = [
      ['Nama', student.name],
      ['Tempat, Tanggal Lahir', `${student.birthPlace || '-'}, ${student.birthDate || '-'}`],
      ['Sekolah Asal', student.school || settings.schoolName],
      ['NIS / NISN', `${student.nis || '-'} / ${student.nisn}`],
      ['Nomor Peserta', student.examNumber || '-']
    ];

    details.forEach(([label, value]) => {
      docPdf.setFont('helvetica', 'bold');
      docPdf.text(label, margin + 5, y);
      docPdf.setFont('helvetica', 'normal');
      docPdf.text(`: ${value}`, margin + 55, y);
      y += 8;
    });

    y += 5;
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('DINYATAKAN:', pageWidth / 2, y, { align: 'center' });
    y += 10;
    docPdf.setFontSize(24);
    docPdf.text(student.status.replace('_', ' '), pageWidth / 2, y, { align: 'center' });
    y += 15;

    docPdf.setFontSize(11);
    docPdf.setFont('helvetica', 'normal');
    const footerText = 'Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.';
    docPdf.text(docPdf.splitTextToSize(footerText, pageWidth - 2 * margin), margin, y);
    
    y += 20;
    const rightCol = pageWidth - margin - 60;
    docPdf.text(`${settings.printLocation || '-'}, ${settings.printDate || '-'}`, rightCol, y);
    y += 6;
    docPdf.text('Kepala Sekolah,', rightCol, y);
    
    y += 25;
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(settings.principalName || '-', rightCol, y);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text(`NIP. ${settings.principalNip || '-'}`, rightCol, y + 5);

    // QR Code
    const verifyData = {
      id: student.id || student.nisn,
      n: student.name,
      s: student.status,
      sy: settings.schoolYear,
      ln: settings.letterNumber,
      pn: settings.principalName,
      pl: settings.printLocation,
      pd: settings.printDate,
      ts: Date.now()
    };
    const token = encryptData(verifyData);
    const verifyUrl = `https://panbitsignature.vercel.app/?data=${encodeURIComponent(token)}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
      docPdf.addImage(qrDataUrl, 'PNG', margin, y - 25, 30, 30);
      docPdf.setFontSize(7);
      docPdf.text('Scan untuk Verifikasi', margin, y + 8);
    } catch (e) {
      console.error("QR Generation failed");
    }
  }

  docPdf.save(`SKL_${student.nisn}_${student.name.replace(/\s/g, '_')}.pdf`);
};
