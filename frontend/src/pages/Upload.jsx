import React, { useState, useRef, useCallback } from 'react';
import {
  Camera, MapPin, Phone, DollarSign, FileText,
  CheckCircle2, ArrowRight, ArrowLeft, Sparkles,
  Home, X, Upload as UploadIcon, Image as ImageIcon
} from 'lucide-react';
import MapPicker from '../components/MapPicker';
import { api } from '../api';

/* ─── Step indicator data ─── */
const STEPS = [
  { id: 1, label: 'Payment & Details',  icon: FileText },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Photos',   icon: Camera },
];

const SRI_LANKA_CITIES = [
  'Colombo','Kandy','Galle','Matara','Jaffna',
  'Negombo','Kurunegala','Anuradhapura','Ratnapura','Badulla',
];

export default function Upload({ onUpload }) {
  const [step, setStep]       = useState(1);
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '', address: '', city: '', price: '',
    contact: '', description: '', location: null,
    gender: 'any',
    imageFiles: [], imagePreviews: [],
    receiptFile: null, receiptPreview: null,
  });

  const patch = (obj) => setFormData(fd => ({ ...fd, ...obj }));

  /* ── Image handling ── */
  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!valid.length) return;
    const previews = valid.map(f => URL.createObjectURL(f));
    patch({
      imageFiles:    [...formData.imageFiles,    ...valid],
      imagePreviews: [...formData.imagePreviews, ...previews],
    });
  }, [formData.imageFiles, formData.imagePreviews]);

  const removeImage = (idx) => {
    const files    = formData.imageFiles.filter((_, i) => i !== idx);
    const previews = formData.imagePreviews.filter((_, i) => i !== idx);
    patch({ imageFiles: files, imagePreviews: previews });
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      ['title','address','city','price','contact','description','gender'].forEach(k => fd.append(k, formData[k]));
      if (formData.location) {
        fd.append('latitude',  formData.location.lat);
        fd.append('longitude', formData.location.lng);
      }
      formData.imageFiles.forEach(f => fd.append('images', f));
      if (formData.receiptFile) {
        fd.append('receipt', formData.receiptFile);
      }
      const result = await api.createBoarding(fd);
      onUpload(result);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canStep1 = formData.title && formData.city && formData.price && formData.contact && formData.receiptFile;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Outfit:wght@300;400;500;600;700&display=swap');

        .up-root {
          min-height: 100vh;
          background: #f5f2ec;
          font-family: 'Outfit', sans-serif;
          padding: 48px 24px 80px;
          position: relative;
          overflow-x: hidden;
        }

        /* Textured background */
        .up-root::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            radial-gradient(circle at 15% 20%, rgba(194,166,109,0.18) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(139,100,60,0.13) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23e8e0d0'/%3E%3Crect width='1' height='1' fill='%23ddd4c0' opacity='.4'/%3E%3C/svg%3E");
        }

        .up-inner { position: relative; z-index: 1; max-width: 780px; margin: 0 auto; }

        /* ─ Header ─ */
        .up-header { margin-bottom: 44px; }
        .up-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(139,100,60,0.10);
          border: 1px solid rgba(139,100,60,0.22);
          color: #8B643C; font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 999px; margin-bottom: 16px;
        }
        .up-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800; color: #1a1208;
          line-height: 1.1; letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .up-title span { color: #8B643C; font-style: italic; }
        .up-desc { color: #6b5b45; font-size: 0.92rem; font-weight: 300; max-width: 460px; }

        /* ─ Step rail ─ */
        .step-rail {
          display: flex; align-items: center; gap: 0;
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(139,100,60,0.15);
          border-radius: 20px; padding: 6px;
          backdrop-filter: blur(12px);
          margin-bottom: 36px;
          box-shadow: 0 2px 20px rgba(139,100,60,0.08);
        }
        .step-item {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 11px 8px; border-radius: 14px;
          font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em;
          color: #9c8878; transition: all 0.3s ease; cursor: default;
          position: relative;
        }
        .step-item.active {
          background: linear-gradient(135deg, #8B643C, #c49a5a);
          color: #fff;
          box-shadow: 0 4px 18px rgba(139,100,60,0.35);
        }
        .step-item.done { color: #8B643C; }
        .step-num {
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700;
          background: rgba(139,100,60,0.1); color: #8B643C;
          flex-shrink: 0;
        }
        .step-item.active .step-num { background: rgba(255,255,255,0.25); color: #fff; }
        .step-divider { width: 1px; height: 28px; background: rgba(139,100,60,0.15); flex-shrink: 0; }

        /* ─ Card ─ */
        .up-card {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(139,100,60,0.14);
          border-radius: 28px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.9) inset,
            0 20px 60px rgba(139,100,60,0.10),
            0 4px 16px rgba(0,0,0,0.06);
          overflow: hidden;
          animation: cardSlide 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .card-header {
          padding: 28px 36px 22px;
          border-bottom: 1px solid rgba(139,100,60,0.10);
          background: linear-gradient(180deg, rgba(255,253,248,0.9) 0%, transparent 100%);
          display: flex; align-items: center; gap: 14px;
        }
        .card-icon {
          width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg, #8B643C22, #c49a5a22);
          border: 1px solid rgba(139,100,60,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #8B643C; flex-shrink: 0;
        }
        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem; font-weight: 700; color: #1a1208;
        }
        .card-subtitle { font-size: 0.8rem; color: #9c8878; font-weight: 300; margin-top: 1px; }

        .card-body { padding: 32px 36px; }

        /* ─ Grid ─ */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .col-2 { grid-column: 1 / -1; }
        @media(max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .col-2 { grid-column: auto; } }

        /* ─ Fields ─ */
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field-label {
          font-size: 0.73rem; font-weight: 600; letter-spacing: 0.09em;
          text-transform: uppercase; color: #8B643C;
        }
        .field-wrap {
          position: relative; border-radius: 14px;
          background: rgba(255,253,248,0.8);
          border: 1.5px solid rgba(139,100,60,0.18);
          transition: border-color 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }
        .field-wrap:focus-within {
          border-color: #8B643C;
          box-shadow: 0 0 0 3px rgba(139,100,60,0.12);
        }
        .field-icon {
          position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
          color: rgba(139,100,60,0.45); pointer-events: none;
        }
        .field-input, .field-select, .field-textarea {
          width: 100%; background: transparent; border: none; outline: none;
          font-family: 'Outfit', sans-serif; font-size: 0.92rem;
          color: #1a1208; font-weight: 400; padding: 13px 16px;
        }
        .field-input.with-icon, .field-select.with-icon { padding-left: 44px; }
        .field-input::placeholder { color: rgba(26,18,8,0.25); }
        .field-select { cursor: pointer; appearance: none; }
        .field-select option { background: #fff; color: #1a1208; }
        .field-textarea {
          resize: vertical; min-height: 90px;
          padding: 13px 16px; line-height: 1.6;
        }
        .field-textarea::placeholder { color: rgba(26,18,8,0.25); }

        /* ─ Image drop zone ─ */
        .drop-zone {
          border: 2px dashed rgba(139,100,60,0.3);
          border-radius: 20px; padding: 40px 24px;
          text-align: center; cursor: pointer;
          background: rgba(255,253,248,0.5);
          transition: all 0.25s ease;
          position: relative; overflow: hidden;
        }
        .drop-zone.over {
          border-color: #8B643C;
          background: rgba(139,100,60,0.06);
          transform: scale(1.01);
        }
        .drop-zone:hover { border-color: rgba(139,100,60,0.55); background: rgba(139,100,60,0.04); }
        .drop-icon {
          width: 60px; height: 60px; border-radius: 18px; margin: 0 auto 14px;
          background: linear-gradient(135deg, rgba(139,100,60,0.12), rgba(196,154,90,0.18));
          display: flex; align-items: center; justify-content: center; color: #8B643C;
        }
        .drop-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a1208; margin-bottom: 6px; }
        .drop-sub { font-size: 0.8rem; color: #9c8878; font-weight: 300; }
        .drop-btn {
          display: inline-block; margin-top: 14px; padding: 8px 22px;
          background: linear-gradient(135deg, #8B643C, #c49a5a);
          color: #fff; border-radius: 999px; font-size: 0.8rem; font-weight: 600;
          letter-spacing: 0.04em;
        }

        /* ─ Preview grid ─ */
        .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; margin-top: 20px; }
        .preview-item {
          aspect-ratio: 1; border-radius: 14px; overflow: hidden;
          position: relative; border: 2px solid rgba(139,100,60,0.15);
          animation: popIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes popIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
        .preview-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .preview-remove {
          position: absolute; top: 6px; right: 6px;
          width: 24px; height: 24px; border-radius: 50%;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
          border: none; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .preview-item:hover .preview-remove { opacity: 1; }
        .preview-count {
          position: absolute; bottom: 6px; left: 6px;
          background: rgba(0,0,0,0.5); color: #fff; font-size: 0.65rem;
          padding: 2px 7px; border-radius: 999px; font-weight: 600;
        }

        /* ─ Map container ─ */
        .map-wrap {
          border-radius: 18px; overflow: hidden;
          border: 1.5px solid rgba(139,100,60,0.18);
          box-shadow: 0 4px 20px rgba(139,100,60,0.1);
        }

        /* ─ Error ─ */
        .up-error {
          background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.22);
          color: #dc2626; border-radius: 12px; padding: 12px 18px;
          font-size: 0.85rem; font-weight: 500; margin-bottom: 24px;
          animation: shake 0.35s ease;
        }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

        /* ─ Buttons ─ */
        .btn-row { display: flex; gap: 12px; margin-top: 32px; }
        .btn-back {
          display: flex; align-items: center; gap: 7px;
          padding: 14px 22px; border-radius: 14px; font-family: 'Outfit', sans-serif;
          font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none;
          background: rgba(139,100,60,0.10); color: #8B643C;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-back:hover { background: rgba(139,100,60,0.18); transform: translateX(-2px); }
        .btn-next {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 9px;
          padding: 15px 28px; border-radius: 14px; border: none; cursor: pointer;
          font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 700;
          background: linear-gradient(135deg, #8B643C 0%, #c49a5a 50%, #8B643C 100%);
          background-size: 200% 100%; color: #fff;
          box-shadow: 0 8px 28px rgba(139,100,60,0.35), 0 2px 8px rgba(0,0,0,0.1);
          transition: background-position 0.5s, box-shadow 0.2s, transform 0.15s, opacity 0.2s;
          letter-spacing: 0.02em;
        }
        .btn-next:hover:not(:disabled) {
          background-position: 100% 0;
          box-shadow: 0 12px 36px rgba(139,100,60,0.45);
          transform: translateY(-2px);
        }
        .btn-next:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .btn-next:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-arrow { transition: transform 0.2s; }
        .btn-next:hover .btn-arrow { transform: translateX(4px); }

        /* ─ Spinner ─ */
        .spinner {
          width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ─ Success ─ */
        .success-wrap {
          text-align: center; padding: 64px 40px;
          animation: cardSlide 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .success-ring {
          width: 110px; height: 110px; border-radius: 50%;
          background: linear-gradient(135deg, #8B643C22, #c49a5a33);
          border: 2px solid rgba(139,100,60,0.25);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px; position: relative;
          animation: pulse 2.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(139,100,60,0.2); }
          50%      { box-shadow: 0 0 0 18px rgba(139,100,60,0); }
        }
        .success-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem; font-weight: 800; color: #1a1208; margin-bottom: 10px;
        }
        .success-title span { color: #8B643C; font-style: italic; }
        .success-sub { color: #6b5b45; font-size: 0.92rem; font-weight: 300; max-width: 340px; margin: 0 auto 32px; line-height: 1.6; }
        .success-confetti {
          position: absolute; inset: -20px; pointer-events: none;
          background-image:
            radial-gradient(circle, #c49a5a 2px, transparent 2px),
            radial-gradient(circle, #8B643C 1.5px, transparent 1.5px);
          background-size: 40px 40px, 25px 25px;
          background-position: 0 0, 15px 15px;
          opacity: 0.08; border-radius: inherit;
        }

        /* Location confirmed badge */
        .loc-badge {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 14px;
          background: rgba(139,100,60,0.1); border: 1px solid rgba(139,100,60,0.2);
          color: #8B643C; padding: 6px 14px; border-radius: 999px;
          font-size: 0.78rem; font-weight: 600;
        }
        .loc-dot { width: 7px; height: 7px; border-radius: 50%; background: #8B643C; animation: blink 1.5s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div className="up-root">
        <div className="up-inner">

          {/* ── Header ── */}
          {!done && (
            <div className="up-header">
              <div className="up-eyebrow">
                <Sparkles size={12} />
                New Listing
              </div>
              <h1 className="up-title">List your <span>boarding</span></h1>
              <p className="up-desc">Share your space with the right people. Fill in the details and go live in minutes.</p>
            </div>
          )}

          {/* ── Step Rail ── */}
          {!done && (
            <div className="step-rail">
              {STEPS.map((s, idx) => (
                <React.Fragment key={s.id}>
                  {idx > 0 && <div className="step-divider" />}
                  <div className={`step-item ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}>
                    <div className="step-num">
                      {step > s.id ? <CheckCircle2 size={12} /> : s.id}
                    </div>
                    {s.label}
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {error && <div className="up-error">{error}</div>}

          {/* ══════ STEP 1 — Payment & Details ══════ */}
          {step === 1 && (
            <>
              {/* --- BANK DETAILS SECTION --- */}
              <div className="up-card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                  <div className="card-icon"><DollarSign size={20} /></div>
                  <div>
                    <div className="card-title">Listing Fee Payment</div>
                    <div className="card-subtitle">Pay RS 1000 to list your boarding place</div>
                  </div>
                </div>
                <div className="card-body">
                   <div style={{ background: 'rgba(139,100,60,0.05)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(139,100,60,0.1)', marginBottom: '20px' }}>
                     <h4 style={{ margin: '0 0 10px', color: '#8B643C', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Account Details</h4>
                     <p style={{ margin: '0 0 4px', fontSize: '1rem', color: '#1a1208', fontWeight: 500 }}><strong>Bank:</strong> Bank of Ceylon</p>
                     <p style={{ margin: '0 0 4px', fontSize: '1rem', color: '#1a1208', fontWeight: 500 }}><strong>Branch:</strong> Badulla City Branch (729)</p>
                     <p style={{ margin: '0 0 4px', fontSize: '1rem', color: '#1a1208', fontWeight: 500 }}><strong>Account Name:</strong> MR R M N L RATHNAYAKA</p>
                     <p style={{ margin: 0, fontSize: '1.2rem', color: '#1a1208', fontWeight: 700, marginTop: '8px' }}><strong>Account No:</strong> 0091000137</p>
                   </div>
                   
                   <label className="field-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#8B643C' }}>
                     Payment Receipt (Required)
                   </label>
                   <p style={{ fontSize: '0.85rem', color: '#6b5b45', marginBottom: '1rem', lineHeight: '1.4' }}>
                     Please transfer <strong>RS 1000</strong> to the above account and upload the bank transfer slip or transaction screenshot.
                   </p>
                   
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                     <input 
                       type="file" 
                       accept="image/*" 
                       onChange={e => {
                         const file = e.target.files[0];
                         if (file) {
                           patch({
                             receiptFile: file,
                             receiptPreview: URL.createObjectURL(file)
                           });
                         }
                       }}
                       className="hidden"
                       id="receipt-upload"
                     />
                     <label 
                       htmlFor="receipt-upload" 
                       className="drop-btn" 
                       style={{ margin: 0, padding: '10px 20px', cursor: 'pointer', display: 'inline-block', fontSize: '0.875rem' }}
                     >
                       {formData.receiptFile ? 'Change Receipt' : 'Upload Receipt'}
                     </label>
                     {formData.receiptFile && (
                       <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <CheckCircle2 size={16} /> {formData.receiptFile.name}
                       </span>
                     )}
                   </div>

                   {formData.receiptPreview && (
                     <div style={{ marginTop: '1rem', maxWidth: '240px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                       <img src={formData.receiptPreview} alt="Receipt Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                     </div>
                   )}
                </div>
              </div>

              <div className="up-card">
              <div className="card-header">
                <div className="card-icon"><FileText size={20} /></div>
                <div>
                  <div className="card-title">Basic Information</div>
                  <div className="card-subtitle">Tell us about your boarding place</div>
                </div>
              </div>
              <div className="card-body">
                <div className="form-grid">

                  <div className="field col-2">
                    <label className="field-label">Listing Title</label>
                    <div className="field-wrap">
                      <input className="field-input" placeholder="e.g. Bright Single Room in Colombo 07"
                        value={formData.title}
                        onChange={e => patch({ title: e.target.value })} />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">City</label>
                    <div className="field-wrap">
                      <select className="field-select"
                        value={formData.city}
                        onChange={e => patch({ city: e.target.value })}>
                        <option value="" disabled>Select city</option>
                        {SRI_LANKA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Monthly Rent (LKR)</label>
                    <div className="field-wrap">
                      <DollarSign className="field-icon" size={16} />
                      <input className="field-input with-icon" type="number" placeholder="25,000"
                        value={formData.price}
                        onChange={e => patch({ price: e.target.value })} />
                    </div>
                  </div>

                  <div className="field col-2">
                    <label className="field-label">Exact Address</label>
                    <div className="field-wrap">
                      <MapPin className="field-icon" size={16} />
                      <input className="field-input with-icon" placeholder="123, Park Road, Colombo 03"
                        value={formData.address}
                        onChange={e => patch({ address: e.target.value })} />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Contact Number</label>
                    <div className="field-wrap">
                      <Phone className="field-icon" size={16} />
                      <input className="field-input with-icon" type="tel" placeholder="+94 77 123 4567"
                        value={formData.contact}
                        onChange={e => patch({ contact: e.target.value })} />
                    </div>
                  </div>

                  <div className="field col-2">
                    <label className="field-label">Allowed Gender</label>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {['any', 'boys', 'girls'].map(g => (
                        <label key={g} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          cursor: 'pointer', padding: '10px 16px',
                          borderRadius: '12px',
                          border: `1.5px solid ${formData.gender === g ? '#8B643C' : 'rgba(139,100,60,0.2)'}`,
                          background: formData.gender === g ? 'rgba(139,100,60,0.08)' : 'transparent',
                          color: formData.gender === g ? '#8B643C' : '#6b5b45',
                          fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize',
                          transition: 'all 0.2s'
                        }}>
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={formData.gender === g}
                            onChange={() => patch({ gender: g })}
                            style={{ display: 'none' }}
                          />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="field col-2">
                    <label className="field-label">Description</label>
                    <div className="field-wrap">
                      <textarea className="field-textarea" rows={4}
                        placeholder="Describe the room, amenities, rules, nearby transport…"
                        value={formData.description}
                        onChange={e => patch({ description: e.target.value })} />
                    </div>
                  </div>

                </div>

                <div className="btn-row">
                  <button className="btn-next" disabled={!canStep1} onClick={() => setStep(2)}>
                    <span>Next: Location</span>
                    <ArrowRight size={18} className="btn-arrow" />
                  </button>
                </div>
              </div>
            </div>
          </>
          )}

          {/* ══════ STEP 2 — Location ══════ */}
          {step === 2 && (
            <div className="up-card">
              <div className="card-header">
                <div className="card-icon"><MapPin size={20} /></div>
                <div>
                  <div className="card-title">Pin Your Location</div>
                  <div className="card-subtitle">Help seekers find you precisely</div>
                </div>
              </div>
              <div className="card-body">
                <div className="map-wrap">
                  <MapPicker 
                    initialPosition={formData.location}
                    onPositionSelect={pos => patch({ location: pos })} 
                  />
                </div>
                {formData.location && (
                  <div style={{ textAlign: 'center' }}>
                    <span className="loc-badge">
                      <span className="loc-dot" />
                      Location pinned — {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                    </span>
                  </div>
                )}
                <div className="btn-row">
                  <button className="btn-back" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button className="btn-next" onClick={() => setStep(3)}>
                    <span>Next: Photos</span>
                    <ArrowRight size={18} className="btn-arrow" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════ STEP 3 — Photos ══════ */}
          {step === 3 && (
            <div className="up-card">
              <div className="card-header">
                <div className="card-icon"><Camera size={20} /></div>
                <div>
                  <div className="card-title">Upload Photos</div>
                  <div className="card-subtitle">Great photos get 3× more enquiries</div>
                </div>
              </div>
              <div className="card-body">

                {/* Drop zone */}
                <div
                  className={`drop-zone${dragOver ? ' over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                >
                  <div className="drop-icon">
                    {dragOver ? <UploadIcon size={28} /> : <ImageIcon size={28} />}
                  </div>
                  <div className="drop-title">{dragOver ? 'Drop to upload' : 'Drag photos here'}</div>
                  <div className="drop-sub">PNG, JPG, WEBP — up to 10 MB each</div>
                  <div className="drop-btn">Browse Files</div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                    onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                </div>

                {/* Previews */}
                {formData.imagePreviews.length > 0 && (
                  <div className="preview-grid">
                    {formData.imagePreviews.map((src, i) => (
                      <div className="preview-item" key={i}>
                        <img src={src} alt={`Preview ${i + 1}`} />
                        {i === 0 && <span className="preview-count">Cover</span>}
                        <button className="preview-remove" onClick={() => removeImage(i)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="btn-row" style={{ marginTop: '2.5rem' }}>
                  <button className="btn-back" onClick={() => setStep(2)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button className="btn-next" onClick={handleSubmit} disabled={loading}>
                    {loading
                      ? <><div className="spinner" /><span>Publishing…</span></>
                      : <><span>Publish Listing</span><ArrowRight size={18} className="btn-arrow" /></>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════ SUCCESS ══════ */}
          {done && (
            <div className="up-card">
              <div className="success-wrap">
                <div className="success-ring">
                  <div className="success-confetti" />
                  <CheckCircle2 size={52} color="#8B643C" strokeWidth={1.5} />
                </div>
                <h2 className="success-title">You're <span>live!</span></h2>
                <p className="success-sub">
                  Your boarding listing is now visible to seekers across Sri Lanka.
                  Expect enquiries soon!
                </p>
                <button className="btn-next" style={{ maxWidth: 280, margin: '0 auto' }}
                  onClick={() => window.location.reload()}>
                  <Home size={17} />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}