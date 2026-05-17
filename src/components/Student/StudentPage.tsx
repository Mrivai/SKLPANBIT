import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { format, isAfter, isBefore } from 'date-fns';
import { generateSKL } from '../../lib/pdfGenerator';
import { GraduationCap, Clock, Shield, Search, AlertCircle, Download } from 'lucide-react';

export function StudentPage() {
  const [settings, setSettings] = useState<any>(null);
  const [nisn, setNisn] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(data);
          checkUnlock(data.accessDate);
        } else {
          setIsNotFound(true);
        }
      } catch (err) {
        console.error(err);
        setIsNotFound(true);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings?.accessDate) {
      const timer = setInterval(() => {
        checkUnlock(settings.accessDate);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [settings]);

  const checkUnlock = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    if (isAfter(now, target)) {
      setIsUnlocked(true);
    } else {
      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ h, m, s });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const q = query(collection(db, 'students'), where('nisn', '==', nisn));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('Data NISN tidak ditemukan. Pastikan NISN sudah benar.');
      } else {
        const student = querySnapshot.docs[0].data();
        setStudentData(student);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mencari data.');
    } finally {
      setLoading(false);
    }
  };

  if (isNotFound) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 max-w-md">
        <Shield className="w-16 h-16 text-slate-300 mx-auto mb-6" />
        <h1 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Sistem Belum Siap</h1>
        <p className="text-slate-400 text-sm mb-8 font-medium">Administrator belum melakukan konfigurasi awal pada aplikasi ini.</p>
        <a href="#admin" className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg">Login Admin</a>
      </div>
    </div>
  );

  if (!settings) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Menghubungkan ke Server...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 border-t-4 border-blue-600">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <header className="text-center mb-16">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo Sekolah" className="w-20 h-20 mx-auto mb-6 object-contain" />
          ) : (
             <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-100">
               <GraduationCap className="w-8 h-8 text-white" />
             </div>
          )}
          <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight leading-none">{settings.schoolName}</h1>
          <div className="h-px w-12 bg-slate-200 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Pengumuman Kelulusan {settings.schoolYear}</p>
        </header>

        {!isUnlocked ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center max-w-lg mx-auto border border-slate-200">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-6 h-6 text-slate-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold mb-8 uppercase tracking-widest text-slate-500">Akses Dibuka Dalam</h2>
            <div className="grid grid-cols-3 gap-3">
              <TimeUnit value={timeLeft?.h || 0} label="JAM" />
              <TimeUnit value={timeLeft?.m || 0} label="MENIT" />
              <TimeUnit value={timeLeft?.s || 0} label="DETIK" />
            </div>
            <p className="mt-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              JADWAL RILIS: {format(new Date(settings.accessDate), 'dd MMM yyyy @ HH:mm')}
            </p>
          </div>
        ) : !studentData ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-10 max-w-md mx-auto border border-slate-200"
          >
            <div className="text-center mb-10">
              <Shield className="w-10 h-10 text-blue-600 mx-auto mb-4" />
              <h2 className="text-lg font-bold uppercase tracking-tight">Verifikasi Siswa</h2>
              <p className="text-slate-400 text-xs font-medium mt-1">Masukkan Nomor Induk Siswa Nasional</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nomor NISN</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-medium"
                    placeholder="Contoh: 008XXXXXXX"
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 text-red-600 text-xs font-bold bg-red-50 p-4 rounded-xl border border-red-100 italic">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <button 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl shadow-slate-200 transition-all disabled:opacity-50 uppercase text-xs tracking-widest"
              >
                {loading ? 'MEMVERIFIKASI...' : 'LIHAT HASIL KELULUSAN'}
              </button>
            </form>
          </motion.div>
        ) : (
          <EnvelopeAnimation 
            student={studentData} 
            settings={settings}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
        )}
        
        <div className="mt-20 text-center text-slate-300 text-[10px] uppercase font-bold tracking-[0.3em]">
          E-LULUS SYSTEM &bull; {settings.schoolName} &bull; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="text-3xl font-black text-slate-800 tracking-tighter">{value.toString().padStart(2, '0')}</div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-2 font-black">{label}</div>
    </div>
  );
}

function EnvelopeAnimation({ student, settings, isOpen, setIsOpen }: any) {
  return (
    <div className="flex flex-col items-center">
       <div className="relative w-full max-w-lg aspect-[4/3] flex items-center justify-center perspective-1000">
         <AnimatePresence mode="wait">
           {!isOpen ? (
             <motion.div 
               key="envelope"
               exit={{ y: 200, opacity: 0, scale: 0.8 }}
               onClick={() => setIsOpen(true)}
               className="cursor-pointer group relative"
             >
                <div className="absolute -inset-4 bg-orange-400/20 blur-2xl group-hover:bg-orange-400/30 transition-all rounded-full" />
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-72 h-44 bg-white border border-slate-200 rounded shadow-xl relative flex items-center justify-center overflow-hidden"
                >
                  {/* Flap */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-slate-50 origin-top z-10 border-b border-slate-100" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
                  
                  <div className="text-center px-6 relative z-0">
                    <p className="text-[9px] uppercase tracking-widest mb-1 font-bold text-slate-300">Penerima</p>
                    <p className="font-bold text-sm text-slate-800 uppercase tracking-tight">{student.name}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded">
                      Klik untuk Buka
                    </div>
                  </div>
                </motion.div>
             </motion.div>
           ) : (
             <motion.div 
               key="content"
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
             >
                <div className={`h-2 ${student.status === 'LULUS' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="p-10 text-center">
                  <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Hasil Keputusan Kelulusan</h3>
                  <div className="h-px w-8 bg-slate-100 mx-auto mb-6" />
                  
                  <p className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{student.name}</p>
                  <p className="text-xs font-bold text-slate-400 mb-10">NISN: {student.nisn}</p>

                  <div className="mb-12">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">DINYATAKAN</p>
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-6xl font-black italic tracking-tighter ${student.status === 'LULUS' ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {student.status.replace('_', ' ')}
                    </motion.div>
                  </div>

                  {student.status === 'LULUS' ? (
                    <button 
                      onClick={() => generateSKL(student, settings)}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-slate-100 transition-all transform hover:-translate-y-1 text-xs uppercase tracking-widest"
                    >
                      <Download className="w-4 h-4" /> Simpan Dokumen SKL
                    </button>
                  ) : (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold italic border border-red-100">
                      Silakan hubungi bagian kurikulum untuk informasi lebih lanjut.
                    </div>
                  )}
                  
                  <div className="mt-12 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Lembaga</p>
                      <p className="text-[11px] font-bold text-slate-600 truncate">{settings.schoolName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Tahun</p>
                      <p className="text-[11px] font-bold text-slate-600">{settings.schoolYear}</p>
                    </div>
                  </div>
                </div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
       
       {isOpen && (
         <button 
           onClick={() => setIsOpen(false)}
           className="mt-8 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
         >
           Tutup Pengumuman
         </button>
       )}
    </div>
  );
}
