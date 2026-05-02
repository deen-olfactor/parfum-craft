import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PROCESS_TYPES } from '../context/AppContext';

export default function FormulasiTincture() {
  const { getAllMaterials, addProcessedMaterial, addStock, getStock, getProject, getPricePerMl } = useApp();

  const [step, setStep] = useState(1);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    try {
      const editId = localStorage.getItem('pf_edit_project');
      if (editId) {
        const p = getProject(editId);
        if (p && (p.type === 'TINCTURE' || p.type === 'DILUTION' || p.type === 'DISTILLATION' || p.type === 'PROCESSED')) {
          // load into form fields if structure matches
          setEditingId(editId);
          setSelectedMaterial(p.parentMaterialId || null);
          setProcessType(p.processType || 'TINCTURE');
          setConcentration(p.concentration || 10);
          setSolvent(p.solvent || '');
          setTotalVolume(p.totalVolume || 100);
          setResultName(p.name || '');
          setNotes(p.notes || '');
          setStep(2);
        }
        localStorage.removeItem('pf_edit_project');
      }
    } catch(e){}
  }, [getProject]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [processType, setProcessType] = useState('');
  const [concentration, setConcentration] = useState(10);
  const [solvent, setSolvent] = useState('');
  const [totalVolume, setTotalVolume] = useState(100);
  const [resultName, setResultName] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const allMaterials = getAllMaterials();

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.odor?.some(o => o.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 50);
  }, [allMaterials, searchTerm]);

  const parentMaterial = selectedMaterial ? allMaterials.find(m => m.id === selectedMaterial) : null;

  const calculatedAmount = useMemo(() => {
    if (!concentration || !totalVolume) return 0;
    return (concentration / 100) * totalVolume;
  }, [concentration, totalVolume]);

  const calculatedSolvent = useMemo(() => {
    if (!totalVolume || !calculatedAmount) return 0;
    return totalVolume - calculatedAmount;
  }, [totalVolume, calculatedAmount]);

  const estimatedCost = useMemo(() => {
    if (!parentMaterial) return 0;
    const pricePerMl = getPricePerMl(parentMaterial) || 0;
    return calculatedAmount * pricePerMl;
  }, [parentMaterial, calculatedAmount, getPricePerMl]);

  const existingStock = useMemo(() => {
    if (!selectedMaterial) return null;
    return getStock(selectedMaterial);
  }, [selectedMaterial, getStock]);

  const solventOptions = [
    { id: 'ethanol', name: 'Ethanol 96%', price: 640 },
    { id: 'dipropylene-glycol', name: 'Dipropylene Glycol (DPG)', price: 354 },
    { id: 'ipm', name: 'Isopropyl Myristate (IPM)', price: 1000 },
    { id: 'fractionated-coconut-oil', name: 'Fractionated Coconut Oil', price: 1000 },
    { type: 'custom', name: 'Custom solvent' }
  ];

  const resetForm = () => {
    setStep(1);
    setSelectedMaterial(null);
    setProcessType('');
    setConcentration(10);
    setSolvent('');
    setTotalVolume(100);
    setResultName('');
    setNotes('');
    setSearchTerm('');
  };

  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material.id);
    setResultName(`${material.name} ${processType === 'TINCTURE' ? 'Tincture' : processType === 'DILUTION' ? 'Dilution' : 'Distillate'} ${concentration}%`);
    setStep(2);
  };

  const handleProcessTypeSelect = (type) => {
    setProcessType(type);
    setStep(2);
    if (parentMaterial) {
      setResultName(`${parentMaterial.name} ${type === 'TINCTURE' ? 'Tincture' : type === 'DILUTION' ? 'Dilution' : 'Distillate'} ${concentration}%`);
    }
  };

  const handleSave = () => {
    if (!selectedMaterial || !processType) {
      alert('Pilih material dan jenis proses');
      return;
    }

    if (!resultName.trim()) {
      alert('Masukkan nama hasil');
      return;
    }

    const solventMaterial = solventOptions.find(s => s.id === solvent) || { name: solvent || 'Custom' };

    const processedMaterial = {
      name: resultName,
      parentMaterialId: selectedMaterial,
      parentMaterialName: parentMaterial?.name,
      processType,
      concentration,
      solvent: solventMaterial.name,
      totalVolume,
      materialAmount: calculatedAmount,
      solventAmount: calculatedSolvent,
      estimatedCost,
      usage: parentMaterial?.usage || 'Base',
      odor: parentMaterial?.odor || [],
      notes,
    };

    addProcessedMaterial(processedMaterial);

    // Add to stock
    addStock({
      materialId: selectedMaterial,
      quantity: calculatedAmount,
      purchasePrice: estimatedCost / calculatedAmount,
      purchaseDate: new Date().toISOString(),
    });

    alert('Material berhasil di-proses dan ditambahkan ke library!');
    resetForm();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Proses Material</h1>
        <p className="page-subtitle">Buat tincture, dilution, atau distillate dari material dasar</p>
      </div>

      {step === 1 && (
        <>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Pilih Jenis Proses</h3>
            <div className="grid-3">
              {Object.entries(PROCESS_TYPES).map(([key, value]) => (
                <div
                  key={key}
                  className={`list-item ${processType === key ? 'selected' : ''}`}
                  onClick={() => handleProcessTypeSelect(key)}
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                >
                  <div className="list-item-content">
                    <div className="list-item-title" style={{ fontSize: '18px', fontWeight: 600 }}>{value.label}</div>
                    <div className="list-item-subtitle">{value.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Pilih Material Dasar</h3>
            <div className="search-box" style={{ marginBottom: '16px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Cari material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="list-item"
                  onClick={() => handleMaterialSelect(material)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="list-item-content">
                    <div className="list-item-title">{material.name}</div>
                    <div className="list-item-subtitle">
                      <span className={`badge badge-${material.type?.toLowerCase()?.slice(0,2)}`}>{material.type}</span>
                      {' '}{material.odor?.slice(0, 3).join(', ')}
                    </div>
                  </div>
                  <div className="font-mono text-sm">
                    {(material.pricePerUnit || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}/g
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 2 && parentMaterial && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Konfigurasi Proses</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>
              ← Ganti Material
            </button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{parentMaterial.name}</div>
            <div className="text-sm text-secondary">
              {parentMaterial.type} • {(parentMaterial.pricePerUnit || 0).toFixed(2)} per unit
              {existingStock && (
                <span> • Stock: {existingStock.quantity.toFixed(1)} ml</span>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Konsentrasi (%) *</label>
              <input
                type="number"
                className="form-input"
                value={concentration}
                onChange={(e) => {
                  setConcentration(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)));
                  if (parentMaterial) {
                    setResultName(`${parentMaterial.name} ${processType === 'TINCTURE' ? 'Tincture' : processType === 'DILUTION' ? 'Dilution' : 'Distillate'} ${concentration}%`);
                  }
                }}
                min="0.1"
                max="100"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Volume (ml)</label>
              <input
                type="number"
                className="form-input"
                value={totalVolume}
                onChange={(e) => setTotalVolume(parseFloat(e.target.value) || 0)}
                min="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Solvent / Pelarut</label>
            <select
              className="form-select"
              value={solvent}
              onChange={(e) => setSolvent(e.target.value)}
            >
              <option value="">Pilih solvent...</option>
              {solventOptions.map(opt => (
                <option key={opt.id || opt.name} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ marginBottom: '12px' }}>Hasil Kalkulasi</h4>
            <div className="grid-2" style={{ gap: '16px' }}>
              <div>
                <div className="text-sm text-secondary">Material</div>
                <div className="font-mono" style={{ fontSize: '18px' }}>{calculatedAmount.toFixed(2)} ml</div>
              </div>
              <div>
                <div className="text-sm text-secondary">Solvent</div>
                <div className="font-mono" style={{ fontSize: '18px' }}>{calculatedSolvent.toFixed(2)} ml</div>
              </div>
              <div>
                <div className="text-sm text-secondary">Estimated Cost</div>
                <div className="font-mono" style={{ fontSize: '18px' }}>
                  {estimatedCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-secondary">Harga per ml</div>
                <div className="font-mono" style={{ fontSize: '18px' }}>
                  {(estimatedCost / totalVolume).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Hasil *</label>
            <input
              type="text"
              className="form-input"
              value={resultName}
              onChange={(e) => setResultName(e.target.value)}
              placeholder="Contoh: Oud Tincture 10%"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan proses..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={resetForm}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave}>
              Proses & Simpan ke Library
            </button>
          </div>
        </div>
      )}

      {step === 2 && !parentMaterial && (
        <div className="card">
          <p>Material tidak ditemukan. <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>Pilih ulang</button></p>
        </div>
      )}
    </div>
  );
}