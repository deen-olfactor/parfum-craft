import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function FormulasiBibit() {
  const { bibits, getAllMaterials, saveProject, projectTypes } = useApp();
  const [activeTab, setActiveTab] = useState('mix');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [showBibitPicker, setShowBibitPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [bibitSearch, setBibitSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  // Mix Bibit state
  const [bibitSelections, setBibitSelections] = useState([]);

  // Tweak Bibit state
  const [selectedBibit, setSelectedBibit] = useState(null);
  const [tweakMaterials, setTweakMaterials] = useState([]);
  const [bibitPercentage, setBibitPercentage] = useState(80);

  const allMaterials = getAllMaterials();

  const filteredBibits = useMemo(() => {
    if (!bibitSearch) return bibits.slice(0, 50);
    return bibits.filter(b =>
      b.name.toLowerCase().includes(bibitSearch.toLowerCase()) ||
      b.brand?.toLowerCase().includes(bibitSearch.toLowerCase()) ||
      b.odorProfile?.some(o => o.toLowerCase().includes(bibitSearch.toLowerCase()))
    ).slice(0, 50);
  }, [bibits, bibitSearch]);

  const filteredMaterials = useMemo(() => {
    if (!materialSearch) return allMaterials.slice(0, 50);
    return allMaterials.filter(m =>
      m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.odor?.some(o => o.toLowerCase().includes(materialSearch.toLowerCase()))
    ).slice(0, 50);
  }, [allMaterials, materialSearch]);

  const totalMixPercentage = useMemo(() =>
    bibitSelections.reduce((sum, b) => sum + (b.percentage || 0), 0),
  [bibitSelections]);

  const totalTweakPercentage = useMemo(() => {
    const bibitsPart = selectedBibit ? bibitPercentage : 0;
    const materialsPart = tweakMaterials.reduce((sum, m) => sum + (m.percentage || 0), 0);
    return bibitsPart + materialsPart;
  }, [selectedBibit, bibitPercentage, tweakMaterials]);

  const totalCost = useMemo(() => {
    let total = 0;
    if (activeTab === 'mix') {
      bibitSelections.forEach(bs => {
        const b = bibits.find(x => x.id === bs.bibitId);
        if (b) total += (bs.percentage / 100) * b.pricePerMl;
      });
    } else {
      if (selectedBibit) {
        const b = bibits.find(x => x.id === selectedBibit);
        if (b) total += (bibitPercentage / 100) * b.pricePerMl;
      }
      tweakMaterials.forEach(tm => {
        const mat = allMaterials.find(m => m.id === tm.materialId);
        if (mat) total += (tm.percentage / 100) * (mat.pricePerUnit || 0);
      });
    }
    return total;
  }, [activeTab, bibitSelections, selectedBibit, bibitPercentage, tweakMaterials, bibits, allMaterials]);

  // Mix Bibit functions
  const addBibit = (bibit) => {
    if (bibitSelections.find(b => b.bibitId === bibit.id)) return;
    setBibitSelections([...bibitSelections, { bibitId: bibit.id, percentage: 0 }]);
  };

  const removeBibit = (bibitId) => {
    setBibitSelections(bibitSelections.filter(b => b.bibitId !== bibitId));
  };

  const updateBibitPercentage = (bibitId, percentage) => {
    setBibitSelections(bibitSelections.map(b =>
      b.bibitId === bibitId ? { ...b, percentage: Math.min(100, Math.max(0, percentage)) } : b
    ));
  };

  // Tweak functions
  const addTweakMaterial = (material) => {
    if (tweakMaterials.find(m => m.materialId === material.id)) return;
    setTweakMaterials([...tweakMaterials, { materialId: material.id, percentage: 0 }]);
  };

  const removeTweakMaterial = (materialId) => {
    setTweakMaterials(tweakMaterials.filter(m => m.materialId !== materialId));
  };

  const updateTweakPercentage = (materialId, percentage) => {
    setTweakMaterials(tweakMaterials.map(m =>
      m.materialId === materialId ? { ...m, percentage: Math.min(100, Math.max(0, percentage)) } : m
    ));
  };

  const handleSave = () => {
    if (!projectName.trim()) {
      alert('Masukkan nama project');
      return;
    }

    let project;

    if (activeTab === 'mix') {
      if (bibitSelections.length === 0) {
        alert('Pilih minimal satu bibit');
        return;
      }
      if (Math.abs(totalMixPercentage - 100) > 0.5) {
        alert('Total persentase harus 100%');
        return;
      }

      project = {
        name: projectName,
        type: 'BIBIT_MIX',
        projectType: projectTypes.BIBIT_MIX,
        materials: bibitSelections.map(b => ({
          bibitId: b.bibitId,
          percentage: b.percentage,
          isBibit: true,
        })),
        notes,
        createdAt: new Date().toISOString(),
      };
    } else {
      if (!selectedBibit) {
        alert('Pilih bibit untuk ditweak');
        return;
      }
      if (Math.abs(totalTweakPercentage - 100) > 0.5) {
        alert('Total persentase harus 100%');
        return;
      }

      const tweakMats = tweakMaterials.map(tm => ({
        materialId: tm.materialId,
        percentage: tm.percentage,
        isBibit: false,
      }));

      tweakMats.unshift({
        bibitId: selectedBibit,
        percentage: bibitPercentage,
        isBibit: true,
      });

      project = {
        name: projectName,
        type: 'BIBIT_TWEAK',
        projectType: projectTypes.BIBIT_TWEAK,
        materials: tweakMats,
        notes,
        createdAt: new Date().toISOString(),
      };
    }

    saveProject(project);
    alert('Project disimpan!');

    setProjectName('');
    setBibitSelections([]);
    setSelectedBibit(null);
    setTweakMaterials([]);
    setNotes('');
  };

  const getBibitInfo = (bibitId) => {
    const b = bibits.find(x => x.id === bibitId);
    return b ? { name: b.name, brand: b.brand, pricePerMl: b.pricePerMl } : { name: 'Unknown', brand: '-', pricePerMl: 0 };
  };

  const resetForm = () => {
    setProjectName('');
    setNotes('');
    setBibitSelections([]);
    setSelectedBibit(null);
    setTweakMaterials([]);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Formulasi Bibit Parfum</h1>
        <p className="page-subtitle">Mix bibit parfum atau tweak dengan raw materials</p>
      </div>

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'mix' ? 'active' : ''}`}
            onClick={() => { setActiveTab('mix'); resetForm(); }}
          >
            Mix Bibit
          </button>
          <button
            className={`tab ${activeTab === 'tweak' ? 'active' : ''}`}
            onClick={() => { setActiveTab('tweak'); resetForm(); }}
          >
            Tweaking Bibit
          </button>
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Nama Project *</label>
          <input
            type="text"
            className="form-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Contoh: Signature Blend No.1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan..."
            rows={2}
          />
        </div>
      </div>

      {/* MIX BIBIT TAB */}
      {activeTab === 'mix' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pilih Bibit Parfum</h3>
            <button
              className="btn btn-secondary"
              onClick={() => setShowBibitPicker(true)}
            >
              + Tambah Bibit
            </button>
          </div>

          <div className="search-box" style={{ marginBottom: '16px' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Cari bibit..."
              value={bibitSearch}
              onChange={(e) => setBibitSearch(e.target.value)}
            />
          </div>

          {bibitSelections.length === 0 ? (
            <div className="empty-state">
              <p>Pilih bibit untuk di-mix</p>
            </div>
          ) : (
            <div>
              {bibitSelections.map((selection) => {
                const info = getBibitInfo(selection.bibitId);
                return (
                  <div key={selection.bibitId} className="formula-material-row">
                    <div className="material-info">
                      <div className="material-name">{info.name}</div>
                      <div className="material-meta">{info.brand || '-'}</div>
                    </div>
                    <div className="number-input">
                      <button onClick={() => updateBibitPercentage(selection.bibitId, (selection.percentage || 0) - 1)}>-</button>
                      <input
                        type="number"
                        className="form-input"
                        value={selection.percentage || 0}
                        onChange={(e) => updateBibitPercentage(selection.bibitId, parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="1"
                      />
                      <button onClick={() => updateBibitPercentage(selection.bibitId, (selection.percentage || 0) + 1)}>+</button>
                      <span>%</span>
                    </div>
                    <div className="font-mono text-sm">
                      {info.pricePerMl?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}/ml
                    </div>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => removeBibit(selection.bibitId)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              <div className="cost-breakdown" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Total:</span>
                  <span className="font-mono" style={{ fontSize: '20px', fontWeight: 600 }}>
                    {totalMixPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {bibitSelections.length > 0 && Math.abs(totalMixPercentage - 100) <= 0.5 && (
            <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={handleSave}>
              Simpan Project
            </button>
          )}
        </div>
      )}

      {/* TWEAK BIBIT TAB */}
      {activeTab === 'tweak' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pilih Bibit Base</h3>
            <button
              className="btn btn-secondary"
              onClick={() => setShowBibitPicker(true)}
            >
              {selectedBibit ? 'Ganti Bibit' : '+ Pilih Bibit'}
            </button>
          </div>

          {bibitSearch && (
            <div className="search-box" style={{ marginBottom: '16px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Cari bibit..."
                value={bibitSearch}
                onChange={(e) => setBibitSearch(e.target.value)}
              />
            </div>
          )}

          {selectedBibit && (
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 600 }}>{getBibitInfo(selectedBibit).name}</div>
              <div className="text-sm text-secondary">{getBibitInfo(selectedBibit).brand}</div>
            </div>
          )}

          {selectedBibit && (
            <>
              <div className="form-group">
                <label className="form-label">Persentase Bibit Base: {bibitPercentage}%</label>
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={bibitPercentage}
                  onChange={(e) => setBibitPercentage(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div className="flex justify-between text-sm text-secondary">
                  <span>10%</span>
                  <span>{100 - bibitPercentage}% left for tweaking</span>
                  <span>95%</span>
                </div>
              </div>

              <div className="card-header" style={{ marginTop: '24px' }}>
                <h3 className="card-title">Tweak dengan Raw Materials</h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowMaterialPicker(true)}
                >
                  + Tambah Material
                </button>
              </div>

              {tweakMaterials.length === 0 ? (
                <p className="text-secondary" style={{ textAlign: 'center', padding: '16px' }}>
                  Tambahkan raw materials untuk tweak
                </p>
              ) : (
                <div>
                  {tweakMaterials.map((tm) => {
                    const mat = allMaterials.find(m => m.id === tm.materialId);
                    if (!mat) return null;
                    return (
                      <div key={tm.materialId} className="formula-material-row">
                        <div className="material-info">
                          <div className="material-name">{mat.name}</div>
                          <div className="material-meta">
                            <span className={`badge badge-${mat.type?.toLowerCase()?.slice(0,2)}`}>{mat.type}</span>
                          </div>
                        </div>
                        <div className="number-input">
                          <button onClick={() => updateTweakPercentage(tm.materialId, (tm.percentage || 0) - 0.5)}>-</button>
                          <input
                            type="number"
                            className="form-input"
                            value={tm.percentage || 0}
                            onChange={(e) => updateTweakPercentage(tm.materialId, parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <button onClick={() => updateTweakPercentage(tm.materialId, (tm.percentage || 0) + 0.5)}>+</button>
                          <span>%</span>
                        </div>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => removeTweakMaterial(tm.materialId)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  <div className="cost-breakdown" style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Total:</span>
                      <span className="font-mono" style={{ fontSize: '20px', fontWeight: 600 }}>
                        {totalTweakPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {tweakMaterials.length > 0 && Math.abs(totalTweakPercentage - 100) <= 0.5 && (
                <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={handleSave}>
                  Simpan Project
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* BIBIT PICKER MODAL */}
      {showBibitPicker && (
        <div className="modal-overlay" onClick={() => { setShowBibitPicker(false); setBibitSearch(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Pilih Bibit Parfum</h3>
              <button className="modal-close" onClick={() => { setShowBibitPicker(false); setBibitSearch(''); }}>×</button>
            </div>

            <div className="search-box" style={{ marginBottom: '16px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Cari bibit..."
                value={bibitSearch}
                onChange={(e) => setBibitSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {bibits.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  Belum ada bibit. Tambahkan di menu Bibit.
                </p>
              ) : (
                filteredBibits.map((bibit) => (
                  <div
                    key={bibit.id}
                    className="list-item"
                    onClick={() => {
                      if (activeTab === 'mix') {
                        addBibit(bibit);
                      } else {
                        setSelectedBibit(bibit.id);
                      }
                      setShowBibitPicker(false);
                      setBibitSearch('');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="list-item-content">
                      <div className="list-item-title">{bibit.name}</div>
                      <div className="list-item-subtitle">
                        {bibit.brand || 'No brand'} • {bibit.odorProfile?.slice(0,2).join(', ')}
                      </div>
                    </div>
                    <div className="font-mono text-sm">
                      {(bibit.pricePerMl || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/ml
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MATERIAL PICKER MODAL */}
      {showMaterialPicker && (
        <div className="modal-overlay" onClick={() => { setShowMaterialPicker(false); setMaterialSearch(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Pilih Raw Material</h3>
              <button className="modal-close" onClick={() => { setShowMaterialPicker(false); setMaterialSearch(''); }}>×</button>
            </div>

            <div className="search-box" style={{ marginBottom: '16px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Cari nama atau odor..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="list-item"
                  onClick={() => {
                    addTweakMaterial(material);
                    setShowMaterialPicker(false);
                    setMaterialSearch('');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="list-item-content">
                    <div className="list-item-title">{material.name}</div>
                    <div className="list-item-subtitle">
                      <span className={`badge badge-${material.type?.toLowerCase()?.slice(0,2)}`}>{material.type}</span>
                      {' '}{material.odor?.slice(0, 3).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
