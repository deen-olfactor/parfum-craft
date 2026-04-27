import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function HitungCOGS() {
  const { projects, calculateCOGS } = useApp();
  const [selectedProject, setSelectedProject] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualMaterials, setManualMaterials] = useState([]);
  const [showMaterialSelect, setShowMaterialSelect] = useState(false);

  const getAllMaterials = useApp().getAllMaterials;
  const allMaterials = getAllMaterials();

  const cogs = useMemo(() => {
    if (!selectedProject && manualMaterials.length === 0) return null;

    if (selectedProject) {
      return calculateCOGS(selectedProject.materials, selectedProject.totalMl || 100);
    }

    if (manualMaterials.length > 0) {
      let total = 0;
      const breakdown = manualMaterials.map(m => {
        const mat = allMaterials.find(x => x.id === m.materialId);
        const pricePerUnit = mat?.pricePerUnit || 0;
        const cost = (m.percentage / 100) * pricePerUnit;
        total += cost;
        return { ...m, name: mat?.name || 'Unknown', pricePerUnit, cost };
      });
      return { totalCost: total, breakdown, costPerMl: total / 100 };
    }

    return null;
  }, [selectedProject, manualMaterials, calculateCOGS, allMaterials]);

  const addManualMaterial = (material) => {
    if (manualMaterials.find(m => m.materialId === material.id)) return;
    setManualMaterials([...manualMaterials, { materialId: material.id, percentage: 0 }]);
    setShowMaterialSelect(false);
  };

  const removeManualMaterial = (materialId) => {
    setManualMaterials(manualMaterials.filter(m => m.materialId !== materialId));
  };

  const updateManualPercentage = (materialId, percentage) => {
    setManualMaterials(manualMaterials.map(m =>
      m.materialId === materialId ? { ...m, percentage } : m
    ));
  };

  const totalPercentage = manualMaterials.reduce((sum, m) => sum + (m.percentage || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Hitung COGS</h1>
        <p className="page-subtitle">Kalkulasi cost of goods untuk project parfum</p>
      </div>

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Pilih Project</h3>
          {projects.length === 0 ? (
            <p className="text-secondary">Belum ada project. Buat di menu Formulasi.</p>
          ) : (
            <select
              className="form-select"
              onChange={(e) => {
                setSelectedProject(projects.find(p => p.id === e.target.value));
                setManualMode(false);
              }}
              value={selectedProject?.id || ''}
            >
              <option value="">Pilih project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type === 'RAW_TO_PERFUME' ? 'Raw' : p.type === 'BIBIT_MIX' ? 'Mix Bibit' : 'Tweak'})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Manual</h3>
          <button
            className={`btn ${manualMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setManualMode(!manualMode);
              setSelectedProject(null);
              if (!manualMode) setManualMaterials([]);
            }}
          >
            {manualMode ? 'Mode Manual Aktif' : 'Hitung Manual'}
          </button>

          {manualMode && (
            <div style={{ marginTop: '16px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowMaterialSelect(true)}
                style={{ width: '100%' }}
              >
                + Tambah Material
              </button>

              {manualMaterials.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  {manualMaterials.map((m) => {
                    const mat = allMaterials.find(x => x.id === m.materialId);
                    return (
                      <div key={m.materialId} className="formula-material-row" style={{ marginTop: '8px' }}>
                        <div className="material-info">
                          <div className="material-name">{mat?.name || 'Unknown'}</div>
                        </div>
                        <div className="number-input">
                          <input
                            type="number"
                            className="form-input"
                            value={m.percentage}
                            onChange={(e) => updateManualPercentage(m.materialId, parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span>%</span>
                        </div>
                        <button className="btn btn-secondary btn-icon" onClick={() => removeManualMaterial(m.materialId)}>×</button>
                      </div>
                    );
                  })}
                  <div className="text-sm text-secondary" style={{ marginTop: '8px' }}>
                    Total: {totalPercentage.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {cogs && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>
            Rincian Cost {selectedProject ? `- ${selectedProject.name}` : '(Manual)'}
          </h3>

          <div className="cost-breakdown">
            {cogs.breakdown.map((item, i) => (
              <div key={i} className="cost-item">
                <div>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                  <span className="text-secondary" style={{ marginLeft: '8px' }}>{item.percentage?.toFixed(1)}%</span>
                </div>
                <div className="font-mono">
                  {item.cost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </div>
              </div>
            ))}

            <div className="cost-total">
              <span>Total per 100ml</span>
              <span className="font-mono">
                {cogs.totalCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
              </span>
            </div>

            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                <span>Cost per ml:</span>
                <span className="font-mono" style={{ fontWeight: 600 }}>
                  {(cogs.totalCost / 100).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cost per 30ml:</span>
                <span className="font-mono" style={{ fontWeight: 600 }}>
                  {((cogs.totalCost / 100) * 30).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            style={{ marginTop: '16px' }}
            onClick={() => {
              const content = `COGS Breakdown - ${selectedProject?.name || 'Manual'}\n\n` +
                cogs.breakdown.map(b => `${b.name}: ${b.percentage?.toFixed(1)}% = ${b.cost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`).join('\n') +
                `\n\nTotal: ${cogs.totalCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`;
              navigator.clipboard.writeText(content);
              alert('Copied!');
            }}
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      {showMaterialSelect && (
        <div className="modal-overlay" onClick={() => setShowMaterialSelect(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Pilih Material</h3>
              <button className="modal-close" onClick={() => setShowMaterialSelect(false)}>×</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {allMaterials.slice(0, 50).map((material) => (
                <div
                  key={material.id}
                  className="list-item"
                  onClick={() => addManualMaterial(material)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="list-item-content">
                    <div className="list-item-title">{material.name}</div>
                    <div className="list-item-subtitle">
                      <span className={`badge badge-${material.type?.toLowerCase()?.slice(0,2)}`}>{material.type}</span>
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