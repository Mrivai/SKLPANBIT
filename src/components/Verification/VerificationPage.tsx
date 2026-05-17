import React, { useEffect, useState, useRef } from 'react';
import { decryptData } from '../../lib/crypto';
import { CheckCircle, XCircle, FileText, User, Hash, Calendar, MapPin, Printer, ShieldCheck, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';

export function VerificationPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const ttsPlayed = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encrypted = params.get('data');
    if (encrypted) {
      const decrypted = decryptData(encrypted);
      if (decrypted) {
        setData(decrypted);
        
        const tryPlay = () => {
           if (window.speechSynthesis.speaking) return;
           playTTS(decrypted);
        };

        // Try autoplay
        if (window.speechSynthesis.getVoices().length > 0) {
          tryPlay();
        } else {
          const checkVoices = setInterval(() => {
            if (window.speechSynthesis.getVoices().length > 0) {
              tryPlay();
              clearInterval(checkVoices);
            }
          }, 500);
          window.speechSynthesis.onvoiceschanged = () => {
            tryPlay();
            clearInterval(checkVoices);
          };
          setTimeout(() => clearInterval(checkVoices), 5000);
        }

        // Global interaction fallback (browsers block autoplay speech)
        const handleInteraction = () => {
          // Essential for unlocking iOS/Chrome mobile speech
          window.speechSynthesis.resume();
          tryPlay();
          if (ttsPlayed.current) {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('pointerdown', handleInteraction);
          }
        };

        window.addEventListener('click', handleInteraction, { once: false });
        window.addEventListener('touchstart', handleInteraction, { once: false });
        window.addEventListener('mousedown', handleInteraction, { once: false });
        window.addEventListener('pointerdown', handleInteraction, { once: false });
        
        return () => {
          window.removeEventListener('click', handleInteraction);
          window.removeEventListener('touchstart', handleInteraction);
          window.removeEventListener('mousedown', handleInteraction);
          window.removeEventListener('pointerdown', handleInteraction);
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        setError('Token tidak valid atau rusak.');
      }
    } else {
      setError('Data verifikasi tidak ditemukan.');
    }
  }, []);

  const playTTS = (item: any, force = false) => {
    if (!item || !window.speechSynthesis) return;
    if (ttsPlayed.current && !force) return;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const text = `Selamat, verifikasi data berhasil atas nama ${item.n}. Siswa dinyatakan ${item.s === 'LULUS' ? 'Lulus' : 'Tidak Lulus'}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.toLowerCase().includes('id')) || 
                      voices.find(v => v.lang.toLowerCase().includes('en')) ||
                      voices[0];
      
      if (idVoice) {
        utterance.voice = idVoice;
        utterance.lang = idVoice.lang;
      } else {
        utterance.lang = 'id-ID';
      }
      
      utterance.rate = 0.95;
      utterance.volume = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => {
        ttsPlayed.current = true;
      };

      // Small delay helps avoid collisions in the speech queue
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (e) {
      console.error("Speech Synthesis Error:", e);
    }
  };

  const Card = ({ children, title, icon, color }: any) => (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${color || 'bg-slate-50'}`}>{icon}</div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const InfoRow = ({ label, value }: any) => (
    <div className="flex justify-between items-baseline text-[11px] gap-4">
      <span className="text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">{label}</span>
      <span className="font-bold text-slate-800 text-right">{value}</span>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200 font-sans">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-tight">Verifikasi Gagal</h1>
        <p className="text-slate-500 mb-6 font-medium">{error}</p>
        <button onClick={() => window.location.href = '/'} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs">Kembali</button>
      </div>
    </div>
  );

  if (!data) return <div className="flex items-center justify-center h-screen font-sans font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">Sedang memverifikasi...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded-md">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight uppercase">Panbit Verify</span>
          </div>
          <div className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded border border-emerald-100 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Terverifikasi
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6 space-y-4">
        <header className="text-center py-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
              data.s === 'LULUS' ? 'bg-emerald-50' : 'bg-red-50'
            }`}
          >
            {data.s === 'LULUS' ? (
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
          </motion.div>
          <h1 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">Status Validasi Dokumen</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun Pelajaran {data.sy}</p>
        </header>

        <section className="space-y-4">
          <Card 
            title="Identitas Siswa" 
            icon={<User className="w-4 h-4 text-blue-600" />} 
            color="bg-blue-50"
          >
            <InfoRow label="Lengkap" value={data.n} />
            <InfoRow label="Nomor NISN" value={data.id} />
          </Card>

          <Card 
            title="Keterangan Lulus" 
            icon={<FileText className="w-4 h-4 text-emerald-600" />} 
            color="bg-emerald-50"
          >
            <div className="text-center py-6">
               <div className={`text-5xl font-black italic tracking-tighter mb-1 ${data.s === 'LULUS' ? 'text-emerald-600' : 'text-red-600'}`}>
                 {data.s}
               </div>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Database Validated</p>
            </div>
            <div className="pt-4 border-t border-slate-50 space-y-3">
              <InfoRow label="No. Surat" value={data.ln || '-'} />
              <InfoRow label="Tgl Cetak" value={data.pd || '-'} />
            </div>
          </Card>

          <Card 
            title="Otoritas" 
            icon={<Printer className="w-4 h-4 text-purple-600" />} 
            color="bg-purple-50"
          >
            <InfoRow label="Pejabat" value={data.pn || '-'} />
            <InfoRow label="Lokasi" value={data.pl || '-'} />
          </Card>
        </section>

        <div className="text-center text-slate-300 text-[9px] uppercase font-bold tracking-[0.4em] pt-12">
          Secured by Panbit Signature AES-256
        </div>
      </main>
    </div>
  );
}
