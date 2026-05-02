import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function FormulasiBibit() {
  const { bibits, getAllMaterials, saveProject, projectTypes, getProject, getPricePerMl } = useApp();
  const [activeTab, setActiveTab] = useState('mix');
  const [editingId, setEditingId] = useState(null);

  // Load edit project
  useEffect(() => {
    try {
      const editId = localStorage.getItem('pf_edit_project');
      if (editId) {
        const p = getProject(editId);
        if (p && (p.type === 'BIBIT_MIX' || p.type === 'BIBIT_TWEAK')) {
          setEditingId(editId);
          setProjectName(p.name || '');
          setNotes(p.notes || '');
          if (p.type === 'BIBIT_MIX') {
            setActiveTab('mix');
            setBibitSelections((p.materials || []).map(m => ({ bibitId: m.bibitId, percentage: m.percentage })));
          } else {
            setActiveTab('tweak');
            const mats = (p.materials || []).filter(m => m.isBibit ? false : true);
            // set selectedBibit from first isBibit
            const bib = (p.materials || []).find(m => m.isBibit);
            if (bib) setSelectedBibit(bib.bibitId);
            setBibitPercentage(bib ? bib.percentage : 80);
            setTweakMaterials(mats.map(m => ({ materialId: m.materialId, percentage: m.percentage })));
          }
        }
        localStorage.removeItem('pf_edit_project');
      }
    } catch(e){}
  }, [getProject]);
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [showBibitPicker, setShowBibitPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [bibitSearch, setBibitSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  // Mix Bibit state
  const [bibitSelections, setBibitSelections] = useState([]);

  // Tweak Bibit state (amount-based inputs: amount + unit)
  const [selectedBibit, setSelectedBibit] = useState(null);
  const [tweakMaterials, setTweakMaterials] = useState([]);
  const [bibitAmount, setBibitAmount] = useState(80); // default 80 ml
  const [bibitUnit, setBibitUnit] = useState('ml');

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

  const totalTweakAmount = useMemo(() => {
    const base = selectedBibit ? (bibitAmount || 0) : 0;
    return base + tweakMaterials.reduce((s, m) => s + (m.amount || 0), 0);
  }, [selectedBibit, bibitAmount, tweakMaterials]);

  const totalTweakPercentage = useMemo(() => {
    if (totalTweakAmount === 0) return 0;
    const basePct = selectedBibit ? ((bibitAmount || 0) / totalTweakAmount * 100) : 0;
    const matsPct = tweakMaterials.reduce((s, m) => s + ((m.amount || 0) / totalTweakAmount * 100), 0);
    return basePct + matsPct;
  }, [selectedBibit, bibitAmount, tweakMaterials, totalTweakAmount]);

  const totalCost = useMemo(() => {
    // For mix: keep previous percentage-based simple calc
    if (activeTab === 'mix') {
      let total = 0;
      bibitSelections.forEach(bs => {
        const b = bibits.find(x => x.id === bs.bibitId);
        if (b) total += (bs.percentage / 100) * b.pricePerMl; // cost per 1ml of concentrate
      });
      return total; // represents cost per 1ml of concentrate
    }

    // For tweak: amount-based inputs. Compute cost per unit (unit = same as amounts provided)
    let totalAmount = 0;
    let costSum = 0;

    if (selectedBibit) {
      const b = bibits.find(x => x.id === selectedBibit);
      const amt = bibitAmount || 0;
      const unit = bibitUnit || 'ml';
      totalAmount += amt;
      const price = unit === 'ml' ? (b?.pricePerMl || 0) : (b?.pricePerGram || b?.pricePerUnit || 0);
      costSum += amt * price;
    }

    tweakMaterials.forEach(tm => {
      const mat = allMaterials.find(m => m.id === tm.materialId);
      const amt = tm.amount || 0;
      const unit = tm.unit || 'ml';
      totalAmount += amt;
      if (mat) {
        const price = unit === 'ml' ? (getPricePerMl(mat) || 0) : (mat.pricePerGram || mat.pricePerUnit || 0);
        costSum += amt * price;
      }
    });

    const costPerUnit = totalAmount > 0 ? (costSum / totalAmount) : 0;
    return costPerUnit;
  }, [activeTab, bibitSelections, selectedBibit, bibitAmount, bibitUnit, tweakMaterials, bibits, allMaterials, getPricePerMl]);

  const estimatedCostPer100ml = useMemo(() => (totalCost * 100) || 0, [totalCost]);

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
    setTweakMaterials([...tweakMaterials, { materialId: material.id, amount: 0, unit: 'ml' }]);
  };

  const removeTweakMaterial = (materialId) => {
    setTweakMaterials(tweakMaterials.filter(m => m.materialId !== materialId));
  };

  const updateTweakAmount = (materialId, amount) => {
    setTweakMaterials(tweakMaterials.map(m =>
      m.materialId === materialId ? { ...m, amount: Math.max(0, amount) } : m
    ));
  };

  const updateTweakUnit = (materialId, unit) => {
    setTweakMaterials(tweakMaterials.map(m =>
      m.materialId === materialId ? { ...m, unit } : m
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

      const totalAmount = (bibitAmount || 0) + tweakMaterials.reduce((s, m) => s + (m.amount || 0), 0);

      const tweakMats = tweakMaterials.map(tm => ({
        materialId: tm.materialId,
        amount: tm.amount || 0,
        unit: tm.unit || 'ml',
        percentage: totalAmount > 0 ? ((tm.amount || 0) / totalAmount * 100) : 0,
        isBibit: false,
      }));

      tweakMats.unshift({
        bibitId: selectedBibit,
        amount: bibitAmount || 0,
        unit: bibitUnit || 'ml',
        percentage: totalAmount > 0 ? ((bibitAmount || 0) / totalAmount * 100) : 0,
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
                <label className="form-label">Jumlah Bibit Base</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={bibitAmount}
                    onChange={(e) => setBibitAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    style={{ width: '120px' }}
                  />
                  <select value={bibitUnit} onChange={(e) => setBibitUnit(e.target.value)} className="form-input" style={{ width: '100px' }}>
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                  </select>
                  <div className="text-secondary">{(totalTweakAmount > 0 ? ((bibitAmount || 0) / totalTweakAmount * 100).toFixed(1) : '0.0')}%</div>
                </div>
                <div className="flex justify-between text-sm text-secondary">
                  <span>Unit dapat diset ke ml atau g</span>
                  <span>{totalTweakAmount > 0 ? (100 - (bibitAmount || 0) / totalTweakAmount * 100).toFixed(1) : '100.0'}% left for tweaking</span>
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
                          <button onClick={() => updateTweakAmount(tm.materialId, (tm.amount || 0) - 0.1)}>-</button>
                          <input
                            type="number"
                            className="form-input"
                            value={tm.amount || 0}
                            onChange={(e) => updateTweakAmount(tm.materialId, parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.1"
                            style={{ width: '120px' }}
                          />
                          <select value={tm.unit || 'ml'} onChange={(e) => updateTweakUnit(tm.materialId, e.target.value)} className="form-input" style={{ width: '80px', marginLeft: '8px' }}>
                            <option value="ml">ml</option>
                            <option value="g">g</option>
                          </select>
                          <button onClick={() => updateTweakAmount(tm.materialId, (tm.amount || 0) + 0.1)}>+</button>
                        </div>
                        <div className="font-mono text-sm" style={{ marginLeft: '12px' }}>
                          {totalTweakAmount > 0 ? ((tm.amount || 0) / totalTweakAmount * 100).toFixed(1) : '0.0'}%
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
