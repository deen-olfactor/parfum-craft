import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function FormulasiRaw() {
  const { getAllMaterials, saveProject, inspirations, projectTypes, exchangeRate } = useApp();
  const [projectName, setProjectName] = useState('');
  const [inspiration, setInspiration] = useState('');
  const [materials, setMaterials] = useState([]);
  const [totalMl, setTotalMl] = useState(100);
  const [notes, setNotes] = useState('');
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allMaterials = getAllMaterials();

  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return allMaterials.slice(0, 100);
    return allMaterials.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.odor?.some(o => o.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 100);
  }, [allMaterials, searchTerm]);

  const addMaterial = (material) => {
    if (materials.find(m => m.materialId === material.id)) return;
    setMaterials([...materials, { materialId: material.id, percentage: 0 }]);
  };

  const removeMaterial = (materialId) => {
    setMaterials(materials.filter(m => m.materialId !== materialId));
  };

  const updatePercentage = (materialId, percentage) => {
    setMaterials(materials.map(m =>
      m.materialId === materialId
        ? { ...m, percentage: Math.min(100, Math.max(0, percentage)) }
        : m
    ));
  };

  const totalPercentage = useMemo(() =>
    materials.reduce((sum, m) => sum + (m.percentage || 0), 0),
  [materials]);

  // Calculate total cost in USD and IDR
  const totalCost = useMemo(() => {
    let costUSD = 0;
    materials.forEach(fm => {
      const mat = allMaterials.find(m => m.id === fm.materialId);
      if (mat && mat.pricePerUnit) {
        const amount = (fm.percentage / 100) * (totalMl || 100);
        costUSD += amount * mat.pricePerUnit;
      }
    });
    return { usd: costUSD, idr: costUSD * exchangeRate };
  }, [materials, allMaterials, totalMl, exchangeRate]);

  const handleSave = () => {
    if (!projectName.trim()) {
      alert('Masukkan nama project');
      return;
    }
    if (materials.length === 0) {
      alert('Tambahkan minimal satu bahan');
      return;
    }
    if (Math.abs(totalPercentage - 100) > 0.1) {
      alert('Total persentase harus 100%');
      return;
    }

    const project = {
      name: projectName,
      type: 'RAW_TO_PERFUME',
      projectType: projectTypes.RAW_TO_PERFUME,
      inspiration,
      materials,
      totalMl: parseFloat(totalMl) || 100,
      notes,
      createdAt: new Date().toISOString(),
    };

    saveProject(project);
    alert('Project disimpan!');

    // Reset form
    setProjectName('');
    setInspiration('');
    setMaterials([]);
    setNotes('');
  };

  const getMaterialInfo = (materialId) => {
    const mat = allMaterials.find(m => m.id === materialId);
    if (!mat) return { name: 'Unknown', type: 'Unknown', usage: 'Base' };
    return {
      name: mat.name,
      type: mat.type,
      usage: mat.usage || 'Base',
      pricePerUnit: mat.pricePerUnit || 0,
    };
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Formulasi Raw Material</h1>
        <p className="page-subtitle">Buat parfum直接从 raw materials</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Nama Project *</label>
          <input
            type="text"
            className="form-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Contoh: Oud Noir Special Edition"
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Inspirasi / Reference</label>
            <select
              className="form-select"
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
            >
              <option value="">Pilih parfum (optional)</option>
              {inspirations.map(ins => (
                <option key={ins} value={ins}>{ins}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Total Volume (ml)</label>
            <input
              type="number"
              className="form-input"
              value={totalMl}
              onChange={(e) => setTotalMl(e.target.value)}
              min="1"
              style={{ width: '120px' }}
            />
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
            {materials.map((fm) => {
              const info = getMaterialInfo(fm.materialId);
              return (
                <div key={fm.materialId} className="formula-material-row">
                  <div className="material-info">
                    <div className="material-name">
                      <span className={`type-dot type-dot-${info.type?.toLowerCase()?.slice(0,2)}`}></span>
                      {info.name}
                    </div>
                    <div className="material-meta">
                      <span className={`badge badge-${info.type?.toLowerCase()?.slice(0,2)}`}>{info.type}</span>
                      <span className={`badge badge-${info.usage?.toLowerCase()}`}>{info.usage}</span>
                    </div>
                  </div>
                  <div className="number-input">
                    <button onClick={() => updatePercentage(fm.materialId, (fm.percentage || 0) - 0.5)}>-</button>
                    <input
                      type="number"
                      className="form-input"
                      value={fm.percentage || 0}
                      onChange={(e) => updatePercentage(fm.materialId, parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <button onClick={() => updatePercentage(fm.materialId, (fm.percentage || 0) + 0.5)}>+</button>
                    <span>%</span>
                  </div>
                  <div className="font-mono text-sm">
                    {((totalMl * (fm.percentage || 0)) / 100).toFixed(2)} ml
                  </div>
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => removeMaterial(fm.materialId)}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            <div className="cost-breakdown" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono" style={{ fontSize: '20px', fontWeight: 600 }}>
                    {totalPercentage.toFixed(1)}%
                  </span>
                  {Math.abs(totalPercentage - 100) <= 0.1 ? (
                    <span className="badge badge-middle" style={{ background: '#34C759', color: 'white' }}>✓</span>
                  ) : (
                    <span className="badge badge-top" style={{ background: '#FF9500', color: 'white' }}>
                      {totalPercentage < 100 ? 'Kurang' : 'Berlebih'} {Math.abs(totalPercentage - 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              {materials.length > 0 && totalCost.usd > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <span className="text-secondary">Estimated Cost:</span>
                  <div className="text-right">
                    <div className="font-mono" style={{ fontSize: '16px', fontWeight: 600 }}>
                      ${totalCost.usd.toFixed(2)} USD
                    </div>
                    <div className="font-mono text-sm text-secondary">
                      ≈ {totalCost.idr.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} IDR
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {materials.length > 0 && Math.abs(totalPercentage - 100) <= 0.1 && (
          <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={handleSave}>
            Simpan Project
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
                  className="material-item"
                  onClick={() => { addMaterial(material); setShowMaterialPicker(false); setSearchTerm(''); }}
                >
                  <div className="material-info">
                    <div className="material-name">{material.name}</div>
                    <div className="material-meta">
                      <span className={`badge badge-${material.type?.toLowerCase()?.slice(0,2)}`}>{material.type}</span>
                      {' '}{material.odor?.slice(0, 3).join(', ')}
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