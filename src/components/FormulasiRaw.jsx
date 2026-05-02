import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const FRAGRANCE_TYPES = [
  { value: 'EDT', label: 'EDT (Eau de Toilette) - 5-15% concentrate' },
  { value: 'EDP', label: 'EDP (Eau de Parfum) - 15-20% concentrate' },
  { value: 'EDP Forte', label: 'EDP Forte (20-30% concentrate)' },
  { value: 'Extrait', label: 'Extrait / Parfum - 30-40% concentrate' },
  { value: 'Perfume Oil', label: 'Perfume Oil - 100% concentrate' },
];

const SOLVENT_TYPES = [
  { value: 'Ethanol 96%', label: 'Ethanol 96% (Perfumer\'s Alcohol)' },
  { value: 'DPG', label: 'Dipropylene Glycol (DPG)' },
  { value: 'IPM', label: 'Isopropyl Myristate (IPM)' },
  { value: 'Oil', label: 'Fractionated Coconut Oil / Jojoba' },
  { value: 'Alcohol + DPG', label: 'Mix Alcohol + DPG' },
];

export default function FormulasiRaw() {
  const { getAllMaterials, saveProject, projectTypes, getProject, getPricePerMl, calculateCOGS } = useApp();
  const [projectName, setProjectName] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Load edit project if redirected from Projects
  useEffect(() => {
    try {
      const editId = localStorage.getItem('pf_edit_project');
      if (editId) {
        const p = getProject(editId);
        if (p && p.type === 'RAW_TO_PERFUME') {
          setEditingId(editId);
          setProjectName(p.name || '');
          setFragranceType(p.fragranceType || 'EDP');
          setSolventType(p.solventType || 'Ethanol 96%');
          setMaterials(p.materials || []);
          setNotes(p.notes || '');
        }
        localStorage.removeItem('pf_edit_project');
      }
    } catch (e) {
      // ignore
    }
  }, [getProject]);
  const [fragranceType, setFragranceType] = useState('EDP');
  const [solventType, setSolventType] = useState('Ethanol 96%');
  const [materials, setMaterials] = useState([]);
  const [notes, setNotes] = useState('');
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalMass, setTotalMass] = useState(100); // grams (or ml equivalent) for formula sizing

  // Pyramid notes
  const [pyramidNote, setPyramidNote] = useState({ name: '', usage: 'Top', percentage: 0 });

  const allMaterials = getAllMaterials();

  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return allMaterials.slice(0, 50);
    return allMaterials.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.odor?.some(o => o.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 50);
  }, [allMaterials, searchTerm]);

  const addMaterial = (material) => {
    if (material.usage === 'Top' || material.usage === 'top') {
      material.usage = 'Top';
    } else if (material.usage === 'Middle' || material.usage === 'middle') {
      material.usage = 'Middle';
    } else {
      material.usage = 'Base';
    }
    // default to 0 grams
    setMaterials([...materials, { materialId: material.id, amount: 0, unit: 'g', usage: material.usage || 'Base' }]);
  };

  const removeMaterial = (materialId) => {
    setMaterials(materials.filter(m => m.materialId !== materialId));
  };

  const updateAmount = (materialId, amount) => {
    setMaterials(materials.map(m =>
      m.materialId === materialId
        ? { ...m, amount: Math.max(0, amount) }
        : m
    ));
  };

  const updateUnit = (materialId, unit) => {
    setMaterials(materials.map(m => m.materialId === materialId ? { ...m, unit } : m));
  };

  const totalAmount = useMemo(() => materials.reduce((s, m) => s + (m.amount || 0), 0), [materials]);

  const totalPercentage = useMemo(() => totalMass > 0 ? (totalAmount / totalMass * 100) : 0, [totalAmount, totalMass]);

  // Calculate cost in IDR using calculateCOGS for consistency (totalMass as basis)
  const totalCost = useMemo(() => {
    try {
      const result = calculateCOGS(materials, totalMass || 100);
      return result.totalCost || 0;
    } catch (e) {
      return 0;
    }
  }, [materials, calculateCOGS, totalMass]);

  // Group materials by pyramid level
  const groupedMaterials = useMemo(() => {
    const groups = { Top: [], Middle: [], Base: [] };
    materials.forEach(fm => {
      const mat = allMaterials.find(m => m.id === fm.materialId);
      if (mat) {
        const usage = fm.usage || mat.usage || 'Base';
        if (groups[usage]) {
          groups[usage].push({ ...fm, mat });
        } else {
          groups['Base'].push({ ...fm, mat });
        }
      }
    });
    return groups;
  }, [materials, allMaterials]);

  // Calculate pyramid totals
  const pyramidTotals = useMemo(() => {
    return {
      Top: materials.filter(m => (m.usage || 'Base') === 'Top').reduce((s, m) => s + (m.percentage || 0), 0),
      Middle: materials.filter(m => (m.usage || 'Base') === 'Middle').reduce((s, m) => s + (m.percentage || 0), 0),
      Base: materials.filter(m => (m.usage || 'Base') === 'Base').reduce((s, m) => s + (m.percentage || 0), 0),
    };
  }, [materials]);

  const handleSave = () => {
    if (!projectName.trim()) {
      alert('Masukkan nama project');
      return;
    }
    if (materials.length === 0) {
      alert('Tambahkan minimal satu bahan');
      return;
    }
    if (totalAmount <= 0) {
      alert('Masukkan jumlah bahan (gram) yang benar');
      return;
    }

    // compute percentages from amounts
    const mats = materials.map(m => ({
      materialId: m.materialId,
      amount: m.amount || 0,
      unit: m.unit || 'g',
      percentage: totalAmount > 0 ? ((m.amount || 0) / totalAmount * 100) : 0,
      usage: m.usage || 'Base',
    }));

    const project = {
      id: editingId || undefined,
      name: projectName,
      type: 'RAW_TO_PERFUME',
      projectType: projectTypes.RAW_TO_PERFUME,
      fragranceType,
      solventType,
      materials: mats,
      pyramid: pyramidTotals,
      notes,
      totalMass,
      updatedAt: new Date().toISOString(),
    };

    saveProject(project);
    alert(editingId ? 'Project diperbarui!' : 'Project disimpan!');

    // Reset form
    setEditingId(null);
    setProjectName('');
    setFragranceType('EDP');
    setSolventType('Ethanol 96%');
    setMaterials([]);
    setNotes('');
  };

  const getMaterialInfo = (materialId) => {
    const mat = allMaterials.find(m => m.id === materialId);
    if (!mat) return { name: 'Unknown', type: 'Unknown', usage: 'Base', pricePerUnit: 0 };
    return {
      name: mat.name,
      type: mat.type,
      usage: mat.usage || 'Base',
      pricePerUnit: mat.pricePerUnit || 0,
    };
  };

  const renderMaterialGroup = (usage, label, color) => {
    const group = groupedMaterials[usage];
    if (group.length === 0) return null;

    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: color
          }}></span>
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span className="badge" style={{ background: color, color: 'white', marginLeft: '8px' }}>
            {pyramidTotals[usage].toFixed(1)}%
          </span>
        </div>
        {group.map(({ materialId, amount, unit }) => {
          const info = getMaterialInfo(materialId);
          const pct = totalAmount > 0 ? ((amount || 0) / totalAmount * 100) : 0;
          return (
            <div key={materialId} className="formula-material-row">
              <div className="material-info">
                <div className="material-name">{info.name}</div>
                <div className="material-meta">
                  <span className={`badge badge-${info.type?.toLowerCase()?.slice(0,2)}`}>{info.type}</span>
                </div>
              </div>
              <div className="number-input">
                <button onClick={() => updateAmount(materialId, (amount || 0) - 0.1)}>-</button>
                <input
                  type="number"
                  className="form-input"
                  value={amount || 0}
                  onChange={(e) => updateAmount(materialId, parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                  style={{ width: '120px' }}
                />
                <select value={unit || 'g'} onChange={(e) => updateUnit(materialId, e.target.value)} className="form-input" style={{ width: '80px', marginLeft: '8px' }}>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select>
                <button onClick={() => updateAmount(materialId, (amount || 0) + 0.1)}>+</button>
              </div>
              <div className="font-mono text-sm" style={{ marginLeft: '12px' }}>
                {pct.toFixed(1)}%
              </div>
              <div className="font-mono text-sm" style={{ marginLeft: '12px' }}>
                {(info.pricePerUnit || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}/g
              </div>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => removeMaterial(materialId)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Formulasi Parfum</h1>
        <p className="page-subtitle">Buat parfum dari raw materials dengan kreatifitas pribadimu</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Nama Parfum *</label>
          <input
            type="text"
            className="form-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Contoh: Signature No.1"
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Tipe Parfum</label>
            <select
              className="form-select"
              value={fragranceType}
              onChange={(e) => setFragranceType(e.target.value)}
            >
              {FRAGRANCE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Pelarut / Carrier</label>
            <select
              className="form-select"
              value={solventType}
              onChange={(e) => setSolventType(e.target.value)}
            >
              {SOLVENT_TYPES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan tentang formula ini..."
            rows={2}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Bahan</h3>
          <button
            className="btn btn-primary"
            onClick={() => setShowMaterialPicker(true)}
          >
            + Tambah Bahan
          </button>
        </div>

        {materials.length === 0 ? (
          <div className="empty-state">
            <p>Klik "+ Tambah Bahan" untuk mulai</p>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label className="form-label">Total Formula (gram/ml)</label>
              <input type="number" className="form-input" value={totalMass} onChange={(e) => setTotalMass(parseFloat(e.target.value) || 0)} min="1" />
              <div className="text-sm text-secondary" style={{ marginTop: '6px' }}>
                Total mass yang dipakai untuk menghitung persentase bahan.
              </div>
            </div>

            {renderMaterialGroup('Top', 'Top Note', '#007AFF')}
            {renderMaterialGroup('Middle', 'Middle Note', '#34C759')}
            {renderMaterialGroup('Base', 'Base Note', '#FF9500')}

            <div className="cost-breakdown" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono" style={{ fontSize: '20px', fontWeight: 600 }}>
                    {(totalAmount > 0 && totalMass > 0) ? ((totalAmount / totalMass * 100).toFixed(1)) + '%' : '0.0%'}
                  </span>
                  {Math.abs((totalAmount / totalMass * 100 || 0) - 100) <= 0.1 ? (
                    <span className="badge badge-middle" style={{ background: '#34C759', color: 'white' }}>✓</span>
                  ) : (
                    <span className="badge badge-top" style={{ background: '#FF9500', color: 'white' }}>
                      {((totalAmount / totalMass * 100 || 0) < 100 ? 'Kurang' : 'Berlebih')} {Math.abs((totalAmount / totalMass * 100 || 0) - 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              {materials.length > 0 && totalCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <span className="text-secondary">Estimated Cost ({totalMass} g):</span>
                  <div className="font-mono" style={{ fontSize: '16px', fontWeight: 600 }}>
                    {totalCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {materials.length > 0 && Math.abs(totalPercentage - 100) <= 0.1 && (
          <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={handleSave}>
            Simpan Formula
          </button>
        )}
      </div>

      {showMaterialPicker && (
        <div className="modal-overlay" onClick={() => setShowMaterialPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Pilih Bahan</h3>
              <button className="modal-close" onClick={() => setShowMaterialPicker(false)}>×</button>
            </div>

            <div className="search-box" style={{ marginBottom: '16px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Cari nama atau odor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="list-item"
                  onClick={() => { addMaterial(material); setShowMaterialPicker(false); setSearchTerm(''); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="list-item-content">
                    <div className="list-item-title">{material.name}</div>
                    <div className="list-item-subtitle">
                      <span className={`badge badge-${material.type?.toLowerCase()?.slice(0,2)}`}>{material.type}</span>
                      {' '}{material.usage || 'Base'} note • {material.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}/g
                    </div>
                  </div>
                </div>
              ))}
              {filteredMaterials.length === 0 && (
                <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  Tidak ada bahan yang cocok
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
