import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Image as ImageIcon, Type, QrCode, Save, Trash2, BoxSelect, GripHorizontal } from 'lucide-react';

// Millimeters to Pixels ratio for rendering the A4 canvas
// A4 is 210 x 297 mm
// Let's use exactly 3px per mm for a 630x891 canvas
const MM_TO_PX = 3;
const A4_W = 210 * MM_TO_PX;
const A4_H = 297 * MM_TO_PX;

export function TemplateEditor() {
  const [loading, setLoading] = useState(true);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  
  // elements format: { id, type, text, x, y, size, key? }
  // type is 'text', 'qr'
  // Coordinates are in mm!
  const [elements, setElements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const constraintsRef = useRef(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      const snap = await getDoc(doc(db, 'settings', 'template'));
      if (snap.exists()) {
        const data = snap.data();
        setBackgroundUrl(data.backgroundUrl || '');
        setElements(data.elements || []);
      }
      setLoading(false);
    };
    fetchTemplate();
  }, []);

  const saveTemplate = async () => {
    try {
      await setDoc(doc(db, 'settings', 'template'), {
        backgroundUrl,
        elements
      });
      alert('Template berhasil disimpan!');
    } catch (e) {
      alert('Gagal menyimpan template: ' + e);
    }
  };

  const handleDragEnd = (id: string, info: any) => {
    // Need to convert px translation back to absolute position
    // Framer motion provides offset or absolute?
    // info.point is absolute page position. It's better to calculate relative position within the container.
  };

  // Provide available elements to drop
  const addElement = (type: string, keyName: string = '', defaultText: string = '') => {
    setElements([...elements, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      key: keyName,
      text: defaultText,
      x: 10, // mm
      y: 10, // mm
      size: 12 // pt
    }]);
  };

  const updateElement = (id: string, data: any) => {
    setElements(elements.map(e => e.id === id ? { ...e, ...data } : e));
  };
  
  const removeElement = (id: string) => {
    setElements(elements.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedElement = elements.find(e => e.id === selectedId);

  if (loading) return <div className="p-8 text-slate-400 font-bold uppercase text-xs animate-pulse tracking-widest">Memuat Editor...</div>;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      
      {/* Canvas Area */}
      <div className="flex-1 bg-slate-200/50 rounded-2xl border border-slate-200 overflow-auto flex items-center justify-center p-8">
        
        {/* A4 Canvas Container */}
        <div 
          ref={constraintsRef}
          className="relative bg-white shadow-2xl shrink-0"
          style={{ 
            width: A4_W, 
            height: A4_H,
            backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={() => setSelectedId(null)}
        >
          {!backgroundUrl && (
             <div className="absolute inset-0 flex items-center justify-center text-slate-200 font-bold text-4xl uppercase tracking-widest -rotate-45 pointer-events-none">A4 PAPER</div>
          )}

          {/* Draggable Elements */}
          {elements.map((el) => {
            return (
              <DraggableElement 
                key={el.id} 
                element={el}
                isSelected={el.id === selectedId}
                onSelect={(e: any) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                }}
                onChange={(newPos: any) => {
                   updateElement(el.id, newPos);
                }}
                constraintsRef={constraintsRef}
              />
            )
          })}
        </div>

      </div>

      {/* Tools Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-500" /> Background Template
          </h3>
          <input 
            type="text" 
            placeholder="URL Gambar Latar (PNG/JPG)"
            value={backgroundUrl}
            onChange={(e) => setBackgroundUrl(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded outline-none focus:border-blue-500 mb-2"
          />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            *Masukkan URL gambar background PDF sekolah Anda (A4). Jika kosong, kertas akan berupa warna putih.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
            <BoxSelect className="w-4 h-4 text-emerald-500" /> Tambah Elemen
          </h3>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button onClick={() => addElement('text', 'name', '[NAMA SISWA]')} className="text-[10px] font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2 rounded text-slate-600 transition-all uppercase">Nama Siswa</button>
            <button onClick={() => addElement('text', 'nisn', '[NISN SISWA]')} className="text-[10px] font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2 rounded text-slate-600 transition-all uppercase">NISN</button>
            <button onClick={() => addElement('text', 'status', '[STATUS LULUS]')} className="text-[10px] font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2 rounded text-slate-600 transition-all uppercase">Status</button>
            <button onClick={() => addElement('text', 'ttl', '[TTL SISWA]')} className="text-[10px] font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2 rounded text-slate-600 transition-all uppercase">Tempat/Tgl Lahir</button>
            <button onClick={() => addElement('text', 'custom', 'Teks Bebas')} className="text-[10px] font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2 rounded text-slate-600 transition-all uppercase">Teks Kustom</button>
            <button onClick={() => addElement('qr', 'qr', '[QR Verification]')} className="text-[10px] font-bold border py-2 rounded transition-all bg-slate-900 text-white hover:bg-black border-transparent uppercase">QR Verifikasi</button>
          </div>

          {selectedElement && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
                Edit ({selectedElement.type === 'qr' ? 'QR Code' : 'Teks'})
                <button onClick={() => removeElement(selectedElement.id)} className="text-red-500 hover:text-red-700 p-1" title="Hapus Elemen"><Trash2 className="w-3.5 h-3.5" /></button>
              </h4>
              <div className="space-y-3">
                
                {selectedElement.type === 'text' && (
                  <div className="space-y-1">
                     <label className="text-[10px] font-semibold text-slate-500 uppercase">Konten Text / Variable</label>
                     <input 
                        type="text" 
                        value={selectedElement.text} 
                        onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded"
                     />
                  </div>
                )}
                
                <div className="space-y-1">
                   <label className="text-[10px] font-semibold text-slate-500 uppercase">Ukuran {selectedElement.type === 'qr' ? '(mm)' : '(pt)'}</label>
                   <input 
                      type="number" 
                      value={selectedElement.size} 
                      onChange={(e) => updateElement(selectedElement.id, { size: Number(e.target.value) })}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded"
                      min={6} max={200}
                   />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Posisi X (mm)</label>
                    <input 
                        type="number" 
                        value={Math.round(selectedElement.x)} 
                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50"
                        readOnly
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Posisi Y (mm)</label>
                    <input 
                        type="number" 
                        value={Math.round(selectedElement.y)} 
                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50"
                        readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-slate-100">
            <button 
              onClick={saveTemplate}
              className="w-full bg-blue-600 text-white font-bold py-3 text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" /> Simpan Layout
            </button>
            <p className="text-[9px] text-center text-slate-400 mt-3 font-semibold uppercase leading-relaxed tracking-wider">
              Layout ini akan menimpa seluruh default parameter PDF ketika disimpan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableElement({ element, isSelected, onSelect, onChange, constraintsRef }: any) {
  
  // Calculate relative pixels from mm (1 mm = MM_TO_PX pixels)
  const leftPx = element.x * MM_TO_PX;
  const topPx = element.y * MM_TO_PX;

  const handleDragEnd = (_: any, info: any) => {
    // Because we are using CSS `left` and `top` mapped to initial X, Y, 
    // framer motion handles the transform (x, y offsets).
    // The exact absolute new position inside the container:
    // we must convert info.point back to relative coordinates?
    // Actually, x/y inside `info.offset` gives the drag delta.
    
    // Simpler: use plain React pointer events for exact drag, OR just apply frame-motion offset
    const newXmm = Math.max(0, element.x + (info.offset.x / MM_TO_PX));
    const newYmm = Math.max(0, element.y + (info.offset.y / MM_TO_PX));
    
    onChange({
      x: newXmm,
      y: newYmm
    });
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={constraintsRef}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      style={{
         // We do NOT use left/top because framer motion manages its own x/y inline styles 
         // but wait, if we update element.x and element.y, and pass it to style, 
         // framer-motion's transform will stack. 
         // Workaround: render standard div and let framer motion handle it by setting initial values dynamically?
         // Actually, if we reset transform to none after passing it back up, it works.
      }}
      // Better way to do controlled drag with framer-motion:
      // use `animate` to force position, but then drag takes over.
      initial={{ x: leftPx, y: topPx }}
      animate={{ x: leftPx, y: topPx }}
      transition={{ type: "tween", duration: 0 }} // Disable animation for snappy drag
      className={`absolute cursor-move inline-block origin-top-left group ${isSelected ? 'ring-2 ring-blue-500 shadow-xl z-50' : 'hover:ring-1 hover:ring-slate-400 z-10'}`}
    >
      {/* Visual drag handle indicator inside */}
      {isSelected && (
        <div className="absolute -top-3 -left-3 bg-blue-500 text-white rounded p-0.5 shadow">
          <GripHorizontal className="w-3 h-3" />
        </div>
      )}

      {element.type === 'text' ? (
        <div style={{ fontSize: `${element.size * (MM_TO_PX/0.352778)/3}px`, lineHeight: 1 }} className={`font-mono font-bold whitespace-nowrap p-1 ${isSelected ? 'text-blue-600 bg-white' : 'text-slate-800'}`}>
          {element.text}
        </div>
      ) : (
        <div 
          className="bg-slate-200 border-2 border-slate-400 flex items-center justify-center border-dashed p-1"
          style={{ width: `${element.size * MM_TO_PX}px`, height: `${element.size * MM_TO_PX}px` }}
        >
          <QrCode className="w-1/2 h-1/2 text-slate-400" />
        </div>
      )}
    </motion.div>
  );
}
