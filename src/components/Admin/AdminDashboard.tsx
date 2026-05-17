import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc, 
  query, where, orderBy, writeBatch, getDoc 
} from 'firebase/firestore';
import { 
  Users, Settings, LogOut, Plus, Upload, Download, 
  Search, Trash2, Edit2, Save, X, Shield, BarChart3,
  CheckCircle, XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'students' | 'settings'>('stats');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isInitializing, setIsInitializing] = useState(false);
  const [dbEmpty, setDbEmpty] = useState(false);

  useEffect(() => {
    const checkAdmin = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else {
          // Check if any admins exist
          const adminsSnap = await getDocs(collection(db, 'admins'));
          if (adminsSnap.empty) {
            setDbEmpty(true);
          }
        }
      }
      setLoading(false);
    });
    return () => checkAdmin();
  }, []);

  const claimAdmin = async () => {
    if (!auth.currentUser) return;
    setIsInitializing(true);
    try {
      await setDoc(doc(db, 'admins', auth.currentUser.uid), {
        email: auth.currentUser.email,
        role: 'SUPER_ADMIN'
      });
      setIsAdmin(true);
      // Initialize default settings
      await setDoc(doc(db, 'settings', 'config'), {
        schoolName: 'NAMA SEKOLAH ANDA',
        schoolYear: '2023/2024',
        accessDate: new Date(Date.now() + 86400000).toISOString(),
        logoUrl: ''
      });
      alert("Anda sekarang adalah Administrator!");
    } catch (e) {
      alert("Gagal inisialisasi: " + e);
    } finally {
      setIsInitializing(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Akses Administrator</h1>
          {!auth.currentUser ? (
            <>
              <p className="text-gray-500 mb-8">Silakan masuk untuk mengelola pengumuman.</p>
              <button 
                onClick={async () => {
                  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
                  signInWithPopup(auth, new GoogleAuthProvider());
                }}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg"
              >
                Masuk dengan Google
              </button>
            </>
          ) : dbEmpty ? (
            <>
              <p className="text-gray-500 mb-8 font-medium">Database admin masih kosong. Jadikan akun ({auth.currentUser.email}) sebagai admin pertama?</p>
              <button 
                onClick={claimAdmin}
                disabled={isInitializing}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50"
              >
                {isInitializing ? 'Memproses...' : 'Jadikan Saya Admin'}
              </button>
            </>
          ) : (
            <>
              <p className="text-red-500 mb-8 font-medium">Anda ({auth.currentUser.email}) tidak memiliki akses admin.</p>
              <button 
                onClick={() => auth.signOut()}
                className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
              >
                Ganti Akun
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg">S</div>
          <div>
            <h1 className="text-sm font-bold leading-none">SKL-PANBIT</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            active={activeTab === 'stats'} 
            icon={<BarChart3 className="w-4 h-4" />} 
            label="Dashboard" 
            onClick={() => setActiveTab('stats')} 
          />
          <NavItem 
            active={activeTab === 'students'} 
            icon={<Users className="w-4 h-4" />} 
            label="Data Siswa" 
            onClick={() => setActiveTab('students')} 
          />
          <NavItem 
            active={activeTab === 'settings'} 
            icon={<Settings className="w-4 h-4" />} 
            label="Pengaturan" 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
               <Shield className="w-4 h-4 text-slate-300" />
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-xs font-medium truncate">{auth.currentUser?.email?.split('@')[0] || 'Admin'}</p>
               <p className="text-[10px] text-slate-500 truncate">{auth.currentUser?.email}</p>
             </div>
             <button onClick={() => auth.signOut()} className="text-slate-500 hover:text-white transition-colors">
               <LogOut className="w-4 h-4" />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Pelajaran: <span className="text-slate-900">2023/2024</span></span>
             <span className="h-4 w-[1px] bg-slate-200"></span>
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status: <span className="text-emerald-500 flex items-center gap-1 inline-flex"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> Online</span></span>
           </div>
           <div className="flex items-center gap-3">
             <a href="/" target="_blank" className="px-4 py-2 bg-slate-50 text-slate-600 rounded-md text-[11px] font-bold border border-slate-200 hover:bg-slate-100 transition-colors uppercase tracking-wider">Buka Web Siswa</a>
           </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'students' && <StudentManager />}
          {activeTab === 'settings' && <SettingsManager />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${
        active ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:bg-slate-800'
      }`}
    >
      {icon} {label}
    </button>
  );
}


function StatsView() {
  const [stats, setStats] = useState({ total: 0, lulus: 0, tidakLulus: 0, schoolYear: '', accessDate: '' });

  useEffect(() => {
    const fetchStats = async () => {
      const q = query(collection(db, 'students'));
      const snap = await getDocs(q);
      let l = 0, tl = 0;
      snap.forEach(doc => {
        if (doc.data().status === 'LULUS') l++;
        else tl++;
      });
      const sRef = doc(db, 'settings', 'config');
      const sSnap = await getDoc(sRef);
      const sData = sSnap.exists() ? sSnap.data() : {};
      setStats({ 
        total: snap.size, 
        lulus: l, 
        tidakLulus: tl, 
        schoolYear: sData.schoolYear || '-',
        accessDate: sData.accessDate || ''
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Siswa" 
          value={stats.total} 
          icon={<Users className="w-4 h-4 text-slate-400" />} 
          badge="DATA VALID"
          badgeColor="text-blue-600 bg-blue-50"
        />
        <StatCard 
          label="Lulus" 
          value={stats.lulus} 
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} 
          badge={`${(stats.lulus/stats.total*100 || 0).toFixed(1)}% PERSENTASE`}
          badgeColor="text-emerald-600 bg-emerald-50"
          valueColor="text-emerald-600"
        />
        <StatCard 
          label="Tidak Lulus" 
          value={stats.tidakLulus} 
          icon={<XCircle className="w-4 h-4 text-red-500" />} 
          badge={`${(stats.tidakLulus/stats.total*100 || 0).toFixed(1)}% PERSENTASE`}
          badgeColor="text-red-600 bg-red-50"
          valueColor="text-red-600"
        />
        <StatCard 
          label="Waktu Rilis" 
          value={stats.accessDate ? format(new Date(stats.accessDate), 'HH:mm') : '-'} 
          sub={stats.accessDate ? format(new Date(stats.accessDate), 'dd MMM yyyy') : ''}
          icon={<Settings className="w-4 h-4 text-slate-400" />} 
        />
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-700 mb-4 uppercase tracking-wider">Persentase Kelulusan {stats.schoolYear}</h3>
        <div className="w-full bg-slate-100 h-10 rounded-lg overflow-hidden flex">
          <div className="bg-emerald-600 h-full flex items-center justify-center text-white font-bold text-[10px]" style={{ width: `${stats.lulus/stats.total*100}%` }}>
            {stats.lulus > 0 && `${(stats.lulus/stats.total*100).toFixed(0)}% LULUS`}
          </div>
          <div className="bg-red-600 h-full flex items-center justify-center text-white font-bold text-[10px]" style={{ width: `${stats.tidakLulus/stats.total*100}%` }}>
            {stats.tidakLulus > 0 && `${(stats.tidakLulus/stats.total*100).toFixed(0)}% TIDAK LULUS`}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub, badge, badgeColor, valueColor }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        {icon}
      </div>
      <div>
        <h4 className={`text-2xl font-bold ${valueColor || 'text-slate-900'}`}>{value}</h4>
        {sub && <p className="text-[10px] text-slate-400 mt-1 italic">{sub}</p>}
        {badge && <div className={`text-[9px] font-bold mt-2 inline-block px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}>{badge}</div>}
      </div>
    </div>
  );
}

function StudentManager() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'students'));
    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleImport = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      
      const batch = writeBatch(db);
      for (const row of data) {
         const id = row.NISN.toString();
         const docRef = doc(db, 'students', id);
         batch.set(docRef, {
           name: row.NAME,
           nisn: row.NISN.toString(),
           nis: row.NIS?.toString() || '',
           status: row.STATUS || 'LULUS',
           birthPlace: row.BIRTH_PLACE || '',
           birthDate: row.BIRTH_DATE || '',
           schoolYear: row.SCHOOL_YEAR || '2023/2024'
         });
      }
      await batch.commit();
      fetchStudents();
      alert("Berhasil mengimpor data!");
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Data_Siswa.xlsx");
  };

  const deleteStudent = async (id: string) => {
    if (confirm("Hapus data siswa ini?")) {
      await deleteDoc(doc(db, 'students', id));
      fetchStudents();
    }
  };

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.nisn.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Manajemen Data Siswa</h2>
        <div className="flex gap-2">
          <button onClick={() => {
            const template = [{
              NAME: "CONTOH NAMA SISWA",
              NISN: "0081234455",
              NIS: "12345",
              STATUS: "LULUS",
              BIRTH_PLACE: "Jakarta",
              BIRTH_DATE: "01 Januari 2008",
              SCHOOL_YEAR: "2023/2024"
            }];
            const ws = XLSX.utils.json_to_sheet(template);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");
            XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
          }} className="bg-white border border-slate-200 text-blue-600 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm uppercase tracking-wider">
            <Download className="w-3.5 h-3.5" /> DOWNLOAD TEMPLATE
          </button>
          <label className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm uppercase tracking-wider">
            <Upload className="w-3.5 h-3.5" /> IMPORT EXCEL
            <input type="file" onChange={handleImport} className="hidden" accept=".xlsx,.xls" />
          </label>
          <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm uppercase tracking-wider">
            <Download className="w-3.5 h-3.5" /> EXPORT
          </button>
          <button className="bg-emerald-600 text-white px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5" /> TAMBAH SISWA
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari NISN atau Nama Siswa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500 bg-white"
            />
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">TOTAL: {filtered.length} SISWA</div>
        </div>

        <div className="overflow-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0 z-10">
              <tr>
                <th className="p-3 border-b border-slate-100 font-bold">NISN</th>
                <th className="p-3 border-b border-slate-100 font-bold">NAMA LENGKAP</th>
                <th className="p-3 border-b border-slate-100 font-bold text-center">STATUS</th>
                <th className="p-3 border-b border-slate-100 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                  <td className="p-3 font-mono text-slate-500">{s.nisn}</td>
                  <td className="p-3 font-medium text-slate-900 uppercase tracking-tight">{s.name}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'LULUS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
                      <button className="text-blue-600 font-bold hover:underline">Edit</button>
                      <button onClick={() => deleteStudent(s.id)} className="text-red-600 font-bold hover:underline">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
           <span className="uppercase tracking-widest">Menampilkan {filtered.length} Siswa</span>
           <div className="flex gap-1">
               <button className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50">‹</button>
               <button className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center">1</button>
               <button className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50">›</button>
           </div>
        </div>
      </div>
    </div>
  );
}

function SettingsManager() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'settings', 'config'));
      if (snap.exists()) setSettings(snap.data());
      setLoading(false);
    };
    fetch();
  }, []);

  const saveSettings = async (e: any) => {
    e.preventDefault();
    await setDoc(doc(db, 'settings', 'config'), settings);
    alert("Pengaturan disimpan!");
  };

  const handleYearChange = async (newYear: string) => {
    if (confirm("Merubah tahun pelajaran akan memicu backup data lama dan menghapus data siswa saat ini. Lanjutkan?")) {
      const snap = await getDocs(collection(db, 'students'));
      const students = snap.docs.map(d => d.data());
      const ws = XLSX.utils.json_to_sheet(students);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Backup");
      XLSX.writeFile(wb, `Backup_SKL_${settings.schoolYear.replace('/','-')}.xlsx`);

      const batch = writeBatch(db);
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      setSettings({ ...settings, schoolYear: newYear });
      await setDoc(doc(db, 'settings', 'config'), { ...settings, schoolYear: newYear });
      window.location.reload();
    }
  };

  if (loading) return <div className="text-xs font-bold text-slate-400 p-10 animate-pulse uppercase tracking-[0.2em]">Memuat Konfigurasi...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Konfigurasi Sistem SKL</h2>
        <p className="text-[10px] text-slate-400 mt-1 uppercase">Atur identitas sekolah dan parameter dokumen PDF</p>
      </div>

      <form onSubmit={saveSettings} className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-8">
          {/* Section: Identitas */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <div className="w-1 h-3 bg-blue-600 rounded-full" /> Identitas & Periode
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Sekolah</label>
                <input 
                  type="text" 
                  value={settings.schoolName || ''} 
                  onChange={e => setSettings({...settings, schoolName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500"
                  placeholder="Contoh: SMP Negeri 1 Panbitkan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Pelajaran</label>
                <select 
                  value={settings.schoolYear || ''} 
                  onChange={e => handleYearChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500 bg-white"
                >
                  <option value="2023/2024">2023/2024</option>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Pejabat */}
          <div className="space-y-4">
             <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <div className="w-1 h-3 bg-blue-600 rounded-full" /> Otoritas Tanda Tangan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Kepala Sekolah</label>
                <input 
                  type="text" 
                  value={settings.principalName || ''} 
                  onChange={e => setSettings({...settings, principalName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIP Kepala Sekolah</label>
                <input 
                  type="text" 
                  value={settings.principalNip || ''} 
                  onChange={e => setSettings({...settings, principalNip: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Dokumen */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <div className="w-1 h-3 bg-blue-600 rounded-full" /> Parameter Surat (PDF)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format Nomor Surat</label>
                <input 
                  type="text" 
                  value={settings.letterNumber || ''} 
                  onChange={e => setSettings({...settings, letterNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500"
                  placeholder="Contoh: 421/001/SMP/2024"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Rilis Pengumuman</label>
                <input 
                  type="datetime-local" 
                  value={settings.accessDate || ''} 
                  onChange={e => setSettings({...settings, accessDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempat Cetak</label>
                <input 
                  type="text" 
                  value={settings.printLocation || ''} 
                  onChange={e => setSettings({...settings, printLocation: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Cetak</label>
                <input 
                  type="text" 
                  value={settings.printDate || ''} 
                  onChange={e => setSettings({...settings, printDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 ring-blue-500"
                  placeholder="Contoh: 08 Juni 2024"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded text-xs font-bold shadow-xl shadow-slate-200 hover:bg-black transition-all uppercase tracking-widest">
              <Save className="w-4 h-4" /> Simpan Konfigurasi
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
