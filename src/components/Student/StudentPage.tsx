import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { format, isAfter, isBefore } from 'date-fns';
import { generateSKL } from '../../lib/pdfGenerator';
import { GraduationCap, Clock, Shield, Search, AlertCircle, Download, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

export function StudentPage() {
  const [settings, setSettings] = useState<any>(null);
  const [nisn, setNisn] = useState('');
  const [studentData, setStudentData] = useState<any>(() => {
    const saved = localStorage.getItem('student_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
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
        localStorage.setItem('student_session', JSON.stringify(student));
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
  useEffect(() => {
    if (isOpen && student.status === 'LULUS') {
      const audio = new Audio('/firework.mp3');
      audio.play().catch(e => console.error("Audio playback error:", e));

      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;

      const particleDefaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, particleDefaults, { 
          particleCount,
          origin: { x: Math.random() - 0.2, y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, particleDefaults, { 
          particleCount,
          origin: { x: Math.random() + 0.2, y: Math.random() - 0.2 }
        }));
      }, 250);

      // Initial big pop
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        zIndex: 60
      });

      return () => clearInterval(interval);
    }
  }, [isOpen, student.status]);

  return (
    <div className="flex flex-col items-center">
       <div className="relative w-full max-w-lg aspect-[4/3] flex items-center justify-center perspective-1000 mt-8">
         <AnimatePresence mode="wait">
           {!isOpen ? (
             <motion.div 
               key="envelope"
               exit={{ y: 0, opacity: 0, scale: 0.8 }}
               onClick={() => setIsOpen(true)}
               className="cursor-pointer group relative"
             >
                <div className="absolute -inset-8 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all rounded-full" />
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-80 h-52 bg-[#f4f4f5] shadow-2xl relative overflow-hidden rounded-md transition-all"
                  style={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 20px rgba(0,0,0,0.05) inset"
                  }}
                >
                  {/* Inner Letter slightly poking out visually */}
                  <div className="absolute top-2 left-2 right-2 bottom-2 bg-white flex flex-col justify-center items-center py-6 border border-slate-100 shadow-sm rounded-sm">
                    <FileText className="w-8 h-8 text-blue-100 mb-2" />
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">Surat Keputusan</p>
                    <p className="font-black text-xs text-slate-800 uppercase tracking-tight text-center px-4 line-clamp-2">{student.name}</p>
                  </div>

                  {/* Envelope Flaps */}
                  {/* Left Flap */}
                  <div className="absolute inset-0 bg-[#e4e4e7] z-10" style={{ clipPath: 'polygon(0 0, 50% 50%, 0 100%)', filter: 'drop-shadow(2px 0 2px rgba(0,0,0,0.05))' }} />
                  {/* Right Flap */}
                  <div className="absolute inset-0 bg-[#e4e4e7] z-10" style={{ clipPath: 'polygon(100% 0, 50% 50%, 100% 100%)', filter: 'drop-shadow(-2px 0 2px rgba(0,0,0,0.05))' }} />
                  {/* Bottom Flap */}
                  <div className="absolute inset-0 bg-[#d4d4d8] z-20" style={{ clipPath: 'polygon(0 100%, 50% 50%, 100% 100%)', filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.05))' }} />
                  {/* Top Flap */}
                  <div className="absolute inset-0 bg-[#fafafa] z-30 origin-top" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 55%)', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.08))' }} />

                  {/* Wax Seal */}
                  <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-red-600 rounded-full shadow-lg border-2 border-red-700 flex items-center justify-center text-red-200 z-40 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>

                  <div className="absolute bottom-4 left-0 w-full text-center z-40 pointer-events-none">
                    <span className="text-[9px] uppercase font-bold tracking-widest bg-slate-900/80 text-white px-4 py-1.5 rounded-full shadow-md backdrop-blur-md">Klik Buka Surat</span>
                  </div>
                </motion.div>
             </motion.div>
           ) : (
             <motion.div 
               key="content"
               initial={{ y: 40, opacity: 0, scale: 0.9 }}
               animate={{ y: 0, opacity: 1, scale: 1 }}
               exit={{ y: -40, opacity: 0 }}
               transition={{ type: "spring", stiffness: 200, damping: 20 }}
               className="w-full bg-white rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
             >
                <div className={`h-2 ${student.status === 'LULUS' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`} />
                <div className="p-10 text-center relative overflow-hidden">
                  
                  {student.status === 'LULUS' && (
                     <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl pointer-events-none">
                        <div className="w-32 h-32 bg-emerald-500 rounded-full" />
                     </div>
                  )}

                  <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 relative z-10">Hasil Keputusan Kelulusan</h3>
                  <div className="h-px w-8 bg-slate-200 mx-auto mb-6 relative z-10" />
                  
                  <p className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-1 relative z-10">{student.name}</p>
                  <p className="text-xs font-bold text-slate-400 mb-10 relative z-10">NISN: {student.nisn}</p>

                  <div className="mb-12 relative z-10">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">DINYATAKAN</p>
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                      className={`text-5xl md:text-6xl font-black italic tracking-tighter drop-shadow-sm ${student.status === 'LULUS' ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {student.status.replace('_', ' ')}
                    </motion.div>
                  </div>

                  <div className="relative z-10">
                    {student.status === 'LULUS' ? (
                      <button 
                        onClick={() => generateSKL(student, settings)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-black hover:to-black text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-slate-200 transition-all transform hover:-translate-y-1 text-xs uppercase tracking-widest"
                      >
                        <Download className="w-4 h-4" /> Simpan Dokumen SKL
                      </button>
                    ) : (
                      <div className="p-4 bg-red-50 text-red-700 mx-auto max-w-sm rounded-xl text-xs font-bold border border-red-100 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-left">Silakan hubungi bagian kurikulum sekolah untuk informasi lebih lanjut.</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4 text-left relative z-10">
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Lembaga</p>
                      <p className="text-[11px] font-bold text-slate-600 truncate">{settings.schoolName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Tahun Pelajaran</p>
                      <p className="text-[11px] font-bold text-slate-600">{settings.schoolYear}</p>
                    </div>
                  </div>
                </div>
             </motion.div>
           )}
         </AnimatePresence>
       </div>
       
       <AnimatePresence>
         {isOpen && (
           <motion.button 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0 }}
             onClick={() => setIsOpen(false)}
             className="mt-8 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest transition-colors"
           >
             Tutup Pengumuman
           </motion.button>
         )}
       </AnimatePresence>
    </div>
  );
}
