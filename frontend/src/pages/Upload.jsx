import React, { useState, useRef, useCallback } from 'react';
import {
  Camera, MapPin, Phone, DollarSign, FileText,
  CheckCircle2, ArrowRight, ArrowLeft, Sparkles,
  Home, X, Upload as UploadIcon, Image as ImageIcon
} from 'lucide-react';
import MapPicker from '../components/MapPicker';
import CityPicker from '../components/CityPicker';
import { api } from '../api';

/* ─── Step indicator data ─── */
const STEPS = [
  { id: 1, label: 'Payment & Details',  icon: FileText },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Photos',   icon: Camera },
];

// Full SL city list now comes from the shared data file (imported via CityPicker)

const VEHICLE_TYPES = {
  'Car': ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'Mitsubishi', 'Mazda', 'Daihatsu', 'Subaru', 'Kia', 'Hyundai', 'Perodua', 'Proton', 'Tata', 'Volkswagen', 'Peugeot', 'Renault', 'Citroën', 'Ford', 'Chevrolet', 'Fiat', 'Skoda', 'MG', 'BYD', 'Chery', 'Geely'],
  'Luxury Car': ['Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Volvo', 'Jaguar', 'Porsche', 'MINI', 'Alfa Romeo'],
  'SUV / Jeep / 4x4': ['Toyota', 'Mitsubishi', 'Nissan', 'Suzuki', 'Honda', 'Mazda', 'Isuzu', 'Land Rover', 'Jeep', 'Ford', 'Kia', 'Hyundai', 'Subaru', 'Lexus', 'Mercedes-Benz', 'BMW', 'Audi', 'Mahindra', 'SsangYong', 'MG', 'BYD'],
  'Van': ['Toyota', 'Nissan', 'Mitsubishi', 'Suzuki', 'Daihatsu', 'Mazda', 'Isuzu', 'Hyundai', 'Kia', 'Tata', 'Mahindra', 'DFSK', 'Foton'],
  'Cab / Pickup': ['Toyota', 'Mitsubishi', 'Nissan', 'Isuzu', 'Ford', 'Mazda', 'Tata', 'Mahindra', 'JAC', 'Foton'],
  'Lorry / Truck': ['Isuzu', 'Mitsubishi Fuso', 'Hino', 'Nissan/UD', 'Toyota', 'Tata', 'Ashok Leyland', 'Eicher', 'Mahindra', 'Foton', 'JAC', 'Dongfeng', 'Sinotruk'],
  'Bus': ['Ashok Leyland', 'Tata', 'Mitsubishi Fuso', 'Isuzu', 'Hino', 'Toyota', 'Nissan', 'Hyundai', 'King Long', 'Yutong'],
  'Mini Bus': ['Toyota', 'Nissan', 'Mitsubishi Fuso', 'Isuzu', 'Hyundai', 'Tata', 'Ashok Leyland'],
  'Three-Wheeler': ['Bajaj', 'TVS', 'Piaggio', 'Mahindra', 'Atul'],
  'Motorcycle': ['Honda', 'Yamaha', 'Suzuki', 'Bajaj', 'TVS', 'Hero', 'Royal Enfield', 'KTM', 'Kawasaki', 'BMW Motorrad', 'Benelli'],
  'Scooter': ['Honda', 'Yamaha', 'Suzuki', 'TVS', 'Hero', 'Vespa', 'Aprilia'],
  'Electric Car': ['BYD', 'Nissan', 'MG', 'Tesla', 'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo'],
  'Electric Motorcycle/Scooter': ['Various EV brands/imports'],
  'Tractor': ['Massey Ferguson', 'New Holland', 'Kubota', 'Mahindra', 'TAFE', 'John Deere', 'Yanmar', 'Farmtrac', 'Deutz-Fahr'],
  'Heavy Duty / Construction Vehicle': ['Caterpillar', 'Komatsu', 'JCB', 'Hitachi', 'Volvo', 'Kobelco', 'Hyundai', 'Doosan', 'SANY', 'XCMG', 'LiuGong'],
  'Prime Mover / Tractor Head': ['Volvo', 'Scania', 'Mercedes-Benz', 'MAN', 'Isuzu', 'Hino', 'UD', 'Mitsubishi Fuso', 'Sinotruk'],
  'Tipper / Dump Truck': ['Isuzu', 'Hino', 'Mitsubishi Fuso', 'Tata', 'Ashok Leyland', 'UD', 'Sinotruk', 'Foton'],
  'Refrigerated Truck': ['Isuzu', 'Hino', 'Mitsubishi Fuso', 'Tata', 'Ashok Leyland'],
  'Tanker Truck': ['Isuzu', 'Hino', 'Mitsubishi Fuso', 'Tata', 'Ashok Leyland'],
  'Bicycle': ['Giant', 'Trek', 'Scott', 'Merida', 'Specialized', 'Other'],
  'Boat / Water Transport': ['Yamaha', 'Suzuki Marine', 'Honda Marine', 'Other']
};

export default function Upload({ onUpload }) {
  const [category, setCategory] = useState(null);
  const [step, setStep]       = useState(1);
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '', address: '', city: '', price: '',
    contact: '', description: '', location: null,
    gender: 'any', vehicle_type: '', brand: '',
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
      ['title','address','city','price','contact','description'].forEach(k => fd.append(k, formData[k]));
      if (category === 'boarding') fd.append('gender', formData.gender);
      if (category === 'vehicle') {
        fd.append('vehicle_type', formData.vehicle_type);
        fd.append('brand', formData.brand);
      }
      if (formData.location) {
        fd.append('latitude',  formData.location.lat);
        fd.append('longitude', formData.location.lng);
      }
      formData.imageFiles.forEach(f => fd.append('images', f));
      if (formData.receiptFile) {
        fd.append('receipt', formData.receiptFile);
      }
      let result;
      if (category === 'vehicle') {
        result = await api.createVehicle(fd);
      } else if (category === 'land') {
        result = await api.createLand(fd);
      } else {
        result = await api.createBoarding(fd);
      }
      onUpload(result);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  let canStep1 = formData.title && formData.city && formData.price && formData.contact && formData.receiptFile;
  if (category === 'vehicle') {
    canStep1 = canStep1 && formData.vehicle_type && formData.brand;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Outfit:wght@300;400;500;600;700&display=swap');

        .up-root {
          min-height: 100vh;
          font-family: 'Outfit', sans-serif;
          padding: 48px 24px 80px;
          position: relative;
          overflow-x: hidden;
          
          --up-bg: #f5f2ec;
          --up-primary: #8B643C;
          --up-primary-rgb: 139, 100, 60;
          --up-primary-light: #c49a5a;
          --up-primary-light-rgb: 194, 166, 109;
          --up-text-dark: #1a1208;
          --up-text-sub: #6b5b45;
          --up-text-muted: #9c8878;
          --up-card-bg: rgba(255,255,255,0.75);
          --up-input-bg: rgba(255,253,248,0.8);
          
          background: var(--up-bg);
          transition: background-color 0.6s ease;
        }

        /* ─ Theme overrides ─ */
        .up-root.theme-vehicle {
          --up-bg: #f1f5f9;
          --up-primary: #dc2626; /* Red */
          --up-primary-rgb: 220, 38, 38;
          --up-primary-light: #f87171;
          --up-primary-light-rgb: 248, 113, 113;
          --up-text-dark: #0f172a;
          --up-text-sub: #334155;
          --up-text-muted: #64748b;
          --up-card-bg: rgba(255,255,255,0.85);
          --up-input-bg: rgba(255,255,255,0.9);
        }

        .up-root.theme-land {
          --up-bg: #f0fdf4;
          --up-primary: #16a34a; /* Green */
          --up-primary-rgb: 22, 163, 74;
          --up-primary-light: #4ade80;
          --up-primary-light-rgb: 74, 222, 128;
          --up-text-dark: #064e3b;
          --up-text-sub: #065f46;
          --up-text-muted: #047857;
          --up-card-bg: rgba(255,255,255,0.85);
          --up-input-bg: rgba(255,255,255,0.9);
        }

        .up-root.theme-boarding {
          --up-bg: #fffbf0;
          --up-primary: #ea580c; /* Orange */
          --up-primary-rgb: 234, 88, 12;
          --up-primary-light: #fb923c;
          --up-primary-light-rgb: 251, 146, 60;
          --up-text-dark: #431407;
          --up-text-sub: #7c2d12;
          --up-text-muted: #9a3412;
          --up-card-bg: rgba(255,253,248,0.85);
          --up-input-bg: rgba(255,253,248,0.9);
        }

        /* Textured background */
        .up-root::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            radial-gradient(circle at 15% 20%, rgba(var(--up-primary-light-rgb),0.18) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(var(--up-primary-rgb),0.13) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23e8e0d0'/%3E%3Crect width='1' height='1' fill='%23ddd4c0' opacity='.4'/%3E%3C/svg%3E");
          transition: background-image 0.6s ease;
        }

        .up-root.theme-vehicle::before {
          background-image:
            radial-gradient(circle at 15% 20%, rgba(var(--up-primary-light-rgb),0.18) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(var(--up-primary-rgb),0.13) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23cbd5e1' fill-opacity='0.25' fill-rule='evenodd'/%3E%3C/svg%3E");
        }

        .up-root.theme-land::before {
          background-image:
            radial-gradient(circle at 15% 20%, rgba(var(--up-primary-light-rgb),0.18) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(var(--up-primary-rgb),0.13) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23bbf7d0' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
        }

        .up-root.theme-boarding::before {
          background-image:
            radial-gradient(circle at 15% 20%, rgba(var(--up-primary-light-rgb),0.18) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(var(--up-primary-rgb),0.13) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fed7aa' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .up-inner { position: relative; z-index: 1; max-width: 780px; margin: 0 auto; }

        /* ─ Header ─ */
        .up-header { margin-bottom: 44px; }
        .up-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(var(--up-primary-rgb),0.10);
          border: 1px solid rgba(var(--up-primary-rgb),0.22);
          color: var(--up-primary); font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 999px; margin-bottom: 16px;
        }
        .up-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800; color: var(--up-text-dark);
          line-height: 1.1; letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .up-title span { color: var(--up-primary); font-style: italic; }
        .up-desc { color: var(--up-text-sub); font-size: 0.92rem; font-weight: 300; max-width: 460px; }

        /* ─ Step rail ─ */
        .step-rail {
          display: flex; align-items: center; gap: 0;
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(var(--up-primary-rgb),0.15);
          border-radius: 20px; padding: 6px;
          backdrop-filter: blur(12px);
          margin-bottom: 36px;
          box-shadow: 0 2px 20px rgba(var(--up-primary-rgb),0.08);
        }
        .step-item {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 11px 8px; border-radius: 14px;
          font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em;
          color: var(--up-text-muted); transition: all 0.3s ease; cursor: default;
          position: relative;
        }
        .step-item.active {
          background: linear-gradient(135deg, var(--up-primary), var(--up-primary-light));
          color: #fff;
          box-shadow: 0 4px 18px rgba(var(--up-primary-rgb),0.35);
        }
        .step-item.done { color: var(--up-primary); }
        .step-num {
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700;
          background: rgba(var(--up-primary-rgb),0.1); color: var(--up-primary);
          flex-shrink: 0;
        }
        .step-item.active .step-num { background: rgba(255,255,255,0.25); color: #fff; }
        .step-divider { width: 1px; height: 28px; background: rgba(var(--up-primary-rgb),0.15); flex-shrink: 0; }

        /* ─ Card ─ */
        .up-card {
          background: var(--up-card-bg);
          border: 1px solid rgba(var(--up-primary-rgb),0.14);
          border-radius: 28px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.9) inset,
            0 20px 60px rgba(var(--up-primary-rgb),0.10),
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
          border-bottom: 1px solid rgba(var(--up-primary-rgb),0.10);
          display: flex; align-items: center; gap: 14px;
        }
        .card-icon {
          width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(var(--up-primary-rgb),0.15), rgba(var(--up-primary-light-rgb),0.15));
          border: 1px solid rgba(var(--up-primary-rgb),0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--up-primary); flex-shrink: 0;
        }
        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem; font-weight: 700; color: var(--up-text-dark);
        }
        .card-subtitle { font-size: 0.8rem; color: var(--up-text-muted); font-weight: 300; margin-top: 1px; }

        .card-body { padding: 32px 36px; }

        /* ─ Grid ─ */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .col-2 { grid-column: 1 / -1; }
        @media(max-width: 600px) { .form-grid { grid-template-columns: 1fr; } .col-2 { grid-column: auto; } }

        /* ─ Fields ─ */
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field-label {
          font-size: 0.73rem; font-weight: 600; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--up-primary);
        }
        .field-wrap {
          position: relative; border-radius: 14px;
          background: var(--up-input-bg);
          border: 1.5px solid rgba(var(--up-primary-rgb),0.18);
          transition: border-color 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }
        .field-wrap:focus-within {
          border-color: var(--up-primary);
          box-shadow: 0 0 0 3px rgba(var(--up-primary-rgb),0.12);
        }
        .field-icon {
          position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
          color: rgba(var(--up-primary-rgb),0.45); pointer-events: none;
        }
        .field-input, .field-select, .field-textarea {
          width: 100%; background: transparent; border: none; outline: none;
          font-family: 'Outfit', sans-serif; font-size: 0.92rem;
          color: var(--up-text-dark); font-weight: 400; padding: 13px 16px;
        }
        .field-input.with-icon, .field-select.with-icon { padding-left: 44px; }
        .field-input::placeholder { color: var(--up-text-muted); opacity:0.6; }
        .field-select { cursor: pointer; appearance: none; }
        .field-select option { background: #fff; color: var(--up-text-dark); }
        .field-textarea {
          resize: vertical; min-height: 90px;
          padding: 13px 16px; line-height: 1.6;
        }
        .field-textarea::placeholder { color: var(--up-text-muted); opacity:0.6; }

        /* ─ Image drop zone ─ */
        .drop-zone {
          border: 2px dashed rgba(var(--up-primary-rgb),0.3);
          border-radius: 20px; padding: 40px 24px;
          text-align: center; cursor: pointer;
          background: rgba(var(--up-primary-rgb),0.02);
          transition: all 0.25s ease;
          position: relative; overflow: hidden;
        }
        .drop-zone.over {
          border-color: var(--up-primary);
          background: rgba(var(--up-primary-rgb),0.06);
          transform: scale(1.01);
        }
        .drop-zone:hover { border-color: rgba(var(--up-primary-rgb),0.55); background: rgba(var(--up-primary-rgb),0.04); }
        .drop-icon {
          width: 60px; height: 60px; border-radius: 18px; margin: 0 auto 14px;
          background: linear-gradient(135deg, rgba(var(--up-primary-rgb),0.12), rgba(var(--up-primary-light-rgb),0.18));
          display: flex; align-items: center; justify-content: center; color: var(--up-primary);
        }
        .drop-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--up-text-dark); margin-bottom: 6px; }
        .drop-sub { font-size: 0.8rem; color: var(--up-text-muted); font-weight: 300; }
        .drop-btn {
          display: inline-block; margin-top: 14px; padding: 8px 22px;
          background: linear-gradient(135deg, var(--up-primary), var(--up-primary-light));
          color: #fff; border-radius: 999px; font-size: 0.8rem; font-weight: 600;
          letter-spacing: 0.04em;
        }

        /* ─ Preview grid ─ */
        .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; margin-top: 20px; }
        .preview-item {
          aspect-ratio: 1; border-radius: 14px; overflow: hidden;
          position: relative; border: 2px solid rgba(var(--up-primary-rgb),0.15);
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
          border: 1.5px solid rgba(var(--up-primary-rgb),0.18);
          box-shadow: 0 4px 20px rgba(var(--up-primary-rgb),0.1);
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
          background: rgba(var(--up-primary-rgb),0.10); color: var(--up-primary);
          transition: background 0.2s, transform 0.15s;
        }
        .btn-back:hover { background: rgba(var(--up-primary-rgb),0.18); transform: translateX(-2px); }
        .btn-next {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 9px;
          padding: 15px 28px; border-radius: 14px; border: none; cursor: pointer;
          font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 700;
          background: linear-gradient(135deg, var(--up-primary) 0%, var(--up-primary-light) 50%, var(--up-primary) 100%);
          background-size: 200% 100%; color: #fff;
          box-shadow: 0 8px 28px rgba(var(--up-primary-rgb),0.35), 0 2px 8px rgba(0,0,0,0.1);
          transition: background-position 0.5s, box-shadow 0.2s, transform 0.15s, opacity 0.2s;
          letter-spacing: 0.02em;
        }
        .btn-next:hover:not(:disabled) {
          background-position: 100% 0;
          box-shadow: 0 12px 36px rgba(var(--up-primary-rgb),0.45);
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
        
        /* ─ Category Selection ─ */
        .cat-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
          margin-top: 32px;
        }
        @media(max-width: 700px) { .cat-grid { grid-template-columns: 1fr; } }
        .cat-card {
          background: var(--up-card-bg); border: 2px solid rgba(var(--up-primary-rgb),0.15);
          border-radius: 24px; padding: 32px 24px; text-align: center;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 8px 32px rgba(var(--up-primary-rgb),0.05);
        }
        .cat-card:hover {
          transform: translateY(-6px);
          border-color: var(--up-primary);
          box-shadow: 0 16px 48px rgba(var(--up-primary-rgb),0.15);
        }
        .cat-icon {
          width: 64px; height: 64px; border-radius: 20px;
          background: linear-gradient(135deg, rgba(var(--up-primary-rgb),0.08), rgba(var(--up-primary-light-rgb),0.15));
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px; color: var(--up-primary);
        }
        .cat-title {
          font-family: 'Playfair Display', serif; font-size: 1.4rem;
          font-weight: 700; color: var(--up-text-dark); margin-bottom: 8px;
        }
        .cat-desc { font-size: 0.85rem; color: var(--up-text-sub); line-height: 1.5; }
        .success-ring {
          width: 110px; height: 110px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(var(--up-primary-rgb),0.12), rgba(var(--up-primary-light-rgb),0.2));
          border: 2px solid rgba(var(--up-primary-rgb),0.25);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px; position: relative;
          animation: pulse 2.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(var(--up-primary-rgb),0.2); }
          50%      { box-shadow: 0 0 0 18px rgba(var(--up-primary-rgb),0); }
        }
        .success-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem; font-weight: 800; color: var(--up-text-dark); margin-bottom: 10px;
        }
        .success-title span { color: var(--up-primary); font-style: italic; }
        .success-sub { color: var(--up-text-sub); font-size: 0.92rem; font-weight: 300; max-width: 340px; margin: 0 auto 32px; line-height: 1.6; }
        .success-confetti {
          position: absolute; inset: -20px; pointer-events: none;
          background-image:
            radial-gradient(circle, var(--up-primary-light) 2px, transparent 2px),
            radial-gradient(circle, var(--up-primary) 1.5px, transparent 1.5px);
          background-size: 40px 40px, 25px 25px;
          background-position: 0 0, 15px 15px;
          opacity: 0.15; border-radius: inherit;
        }

        /* Location confirmed badge */
        .loc-badge {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 14px;
          background: rgba(var(--up-primary-rgb),0.1); border: 1px solid rgba(var(--up-primary-rgb),0.2);
          color: var(--up-primary); padding: 6px 14px; border-radius: 999px;
          font-size: 0.78rem; font-weight: 600;
        }
        .loc-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--up-primary); animation: blink 1.5s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div className={`up-root theme-${category || 'default'}`}>
        <div className="up-inner">

          {/* ── Header ── */}
          {!done && (
            <div className="up-header">
              <div className="up-eyebrow">
                <Sparkles size={12} />
                New Listing
              </div>
              <h1 className="up-title">
                {category === 'vehicle' ? 'Park your ' : category === 'land' ? 'Plant your ' : category === 'boarding' ? 'Welcome to your ' : 'List your '}
                <span>{category || 'property'}</span>
              </h1>
              <p className="up-desc">
                {category === 'vehicle' ? 'Share your ride with the right people. Rev up your listing and go live in minutes.' :
                 category === 'land' ? 'Showcase your property to the world. Plant the details and go live in minutes.' :
                 category === 'boarding' ? 'Open your doors to the perfect tenant. Fill in the cozy details and go live in minutes.' :
                 'Share your space or vehicle with the right people. Fill in the details and go live in minutes.'}
              </p>
            </div>
          )}

          {/* ══════ CATEGORY SELECTION ══════ */}
          {!category && !done && (
            <div className="cat-grid">
              <div className="cat-card" onClick={() => setCategory('boarding')}>
                <div className="cat-icon"><Home size={28} /></div>
                <div className="cat-title">Boarding</div>
                <div className="cat-desc">Rooms, annexes, and apartments for rent.</div>
              </div>
              <div className="cat-card" onClick={() => setCategory('vehicle')}>
                <div className="cat-icon"><MapPin size={28} /></div>
                <div className="cat-title">Vehicle</div>
                <div className="cat-desc">Cars, bikes, and vans for rent or hire.</div>
              </div>
              <div className="cat-card" onClick={() => setCategory('land')}>
                <div className="cat-icon"><MapPin size={28} /></div>
                <div className="cat-title">Land</div>
                <div className="cat-desc">Bare lands and properties for sale or lease.</div>
              </div>
            </div>
          )}

          {/* ── Step Rail ── */}
          {category && !done && (
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
          {category && step === 1 && (
            <>
              {/* --- BANK DETAILS SECTION --- */}
              <div className="up-card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                  <div className="card-icon"><DollarSign size={20} /></div>
                  <div>
                    <div className="card-title">Listing Fee Payment</div>
                    <div className="card-subtitle">Pay RS 1000 to list your {category}</div>
                  </div>
                </div>
                <div className="card-body">
                   <div style={{ background: 'rgba(var(--up-primary-rgb),0.05)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(var(--up-primary-rgb),0.1)', marginBottom: '20px' }}>
                     <h4 style={{ margin: '0 0 10px', color: 'var(--up-primary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Account Details</h4>
                     <p style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--up-text-dark)', fontWeight: 500 }}><strong>Bank:</strong> Bank of Ceylon</p>
                     <p style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--up-text-dark)', fontWeight: 500 }}><strong>Branch:</strong> Badulla City Branch (729)</p>
                     <p style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--up-text-dark)', fontWeight: 500 }}><strong>Account Name:</strong> MR R M N L RATHNAYAKA</p>
                     <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--up-text-dark)', fontWeight: 700, marginTop: '8px' }}><strong>Account No:</strong> 0091000137</p>
                   </div>
                   
                   <label className="field-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--up-primary)' }}>
                     Payment Receipt (Required)
                   </label>
                   <p style={{ fontSize: '0.85rem', color: 'var(--up-text-sub)', marginBottom: '1rem', lineHeight: '1.4' }}>
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
                  <div className="card-subtitle">Tell us about your {category}</div>
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
                    <CityPicker
                      light
                      value={formData.city}
                      onChange={city => patch({ city })}
                      placeholder="Type to search city…"
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">{category === 'boarding' ? 'Monthly Rent (LKR)' : 'Price (LKR)'}</label>
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

                  {category === 'boarding' && (
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
                  )}

                  {category === 'vehicle' && (
                    <>
                      <div className="field">
                        <label className="field-label">Vehicle Type</label>
                        <div className="field-wrap">
                          <select className="field-select"
                            value={formData.vehicle_type}
                            onChange={e => patch({ vehicle_type: e.target.value, brand: '' })}>
                            <option value="" disabled>Select vehicle type</option>
                            {Object.keys(VEHICLE_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="field">
                        <label className="field-label">Brand</label>
                        <div className="field-wrap">
                          <select className="field-select"
                            value={formData.brand}
                            onChange={e => patch({ brand: e.target.value })}
                            disabled={!formData.vehicle_type}>
                            <option value="" disabled>Select brand</option>
                            {formData.vehicle_type && VEHICLE_TYPES[formData.vehicle_type].map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="field col-2">
                    <label className="field-label">Description</label>
                    <div className="field-wrap">
                      <textarea className="field-textarea" rows={4}
                        placeholder={`Describe the ${category}, amenities, rules…`}
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
          {category && step === 2 && (
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
          {category && step === 3 && (
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
                  Your {category} listing is now visible to seekers across Sri Lanka.
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