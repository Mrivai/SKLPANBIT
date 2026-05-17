import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { encryptData } from './crypto';

export const generateSKL = async (student: any, settings: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
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
      doc.addImage(base64 as string, 'PNG', 20, y, 20, 20);
    } catch (e) {
      console.error("Logo failed to load for PDF");
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(settings.schoolName.toUpperCase(), pageWidth / 2 + 10, y + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SURAT KETERANGAN LULUS', pageWidth / 2 + 10, y + 14, { align: 'center' });
  doc.text(`Tahun Pelajaran ${settings.schoolYear}`, pageWidth / 2 + 10, y + 19, { align: 'center' });
  
  y += 30;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Nomor: ${settings.letterNumber || '...'}`, margin, y);
  y += 10;

  const content = `Yang bertanda tangan di bawah ini, Kepala ${settings.schoolName} menerangkan bahwa:`;
  const splitContent = doc.splitTextToSize(content, pageWidth - 2 * margin);
  doc.text(splitContent, margin, y);
  y += 15;

  const details = [
    ['Nama', student.name],
    ['Tempat, Tanggal Lahir', `${student.birthPlace || '-'}, ${student.birthDate || '-'}`],
    ['Sekolah Asal', student.school || settings.schoolName],
    ['NIS / NISN', `${student.nis || '-'} / ${student.nisn}`],
    ['Nomor Peserta', student.examNumber || '-']
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${value}`, margin + 55, y);
    y += 8;
  });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('DINYATAKAN:', pageWidth / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(24);
  doc.text(student.status.replace('_', ' '), pageWidth / 2, y, { align: 'center' });
  y += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const footerText = 'Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.';
  doc.text(doc.splitTextToSize(footerText, pageWidth - 2 * margin), margin, y);
  
  y += 20;
  const rightCol = pageWidth - margin - 60;
  doc.text(`${settings.printLocation || '-'}, ${settings.printDate || '-'}`, rightCol, y);
  y += 6;
  doc.text('Kepala Sekolah,', rightCol, y);
  
  y += 25;
  doc.setFont('helvetica', 'bold');
  doc.text(settings.principalName || '-', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${settings.principalNip || '-'}`, rightCol, y + 5);

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
    doc.addImage(qrDataUrl, 'PNG', margin, y - 25, 30, 30);
    doc.setFontSize(7);
    doc.text('Scan untuk Verifikasi', margin, y + 8);
  } catch (e) {
    console.error("QR Generation failed");
  }

  doc.save(`SKL_${student.nisn}_${student.name.replace(/\s/g, '_')}.pdf`);
};
