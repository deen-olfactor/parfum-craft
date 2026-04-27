import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const KOMPONEN_TYPES = [
  { value: 'botol', label: 'Botol', icon: '🧴' },
  { value: 'pelarut', label: 'Pelarut', icon: '🧪' },
  { value: 'packaging', label: 'Packaging', icon: '📦' },
  { value: 'sticker', label: 'Sticker/Label', icon: '🏷️' },
];

const BOTOL_SIZES = [
  { value: '5ml', label: '5 ml' },
  { value: '10ml', label: '10 ml' },
  { value: '20ml', label: '20 ml' },
  { value: '30ml', label: '30 ml' },
  { value: '50ml', label: '50 ml' },
  { value: '100ml', label: '100 ml' },
];

export default function Komponen() {
  const { components, addComponent, updateComponent, deleteComponent } = useApp();
  const [activeType, setActiveType] = useState('botol');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'botol',
    size: '',
    pricePerUnit: '',
    unit: 'pcs',
    notes: ''
  });

  const filteredComponents = useMemo(() => {
    let result = components.filter(c => c.type === activeType);
    if (searchTerm) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [components, activeType, searchTerm]);

  const resetForm = () => {
    setFormData({ name: '', type: activeType, size: '', pricePerUnit: '', unit: 'pcs', notes: '' });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (comp) => {
    setEditingId(comp.id);
    setFormData({
      name: comp.name,
      type: comp.type,
      size: comp.size || '',
      pricePerUnit: comp.pricePerUnit?.toString() || '',
      unit: comp.unit || 'pcs',
      notes: comp.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.pricePerUnit) {
      alert('Nama dan harga harus diisi');
      return;
    }

    const compData = {
      name: formData.name,
      type: formData.type,
      size: formData.size,
      pricePerUnit: parseFloat(formData.pricePerUnit),
      unit: formData.unit,
      notes: formData.notes
    };

    if (editingId) {
      updateComponent(editingId, compData);
    } else {
      addComponent(compData);
    }

    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm('Yakin hapus komponen ini?')) {
      deleteComponent(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Library Komponen</h1>
        <p className="page-subtitle">Kelola komponen produksi: botol, pelarut, packaging, sticker</p>
      </div>

      <div className="card">
        <div className="tabs">
          {KOMPONEN_TYPES.map(ct => (
            <button
              key={ct.value}
              className={`tab ${activeType === ct.value ? 'active' : ''}`}
              onClick={() => setActiveType(ct.value)}
            >
              {ct.icon} {ct.label}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ marginTop: '16px', marginBottom: '16px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={`Cari ${KOMPONEN_TYPES.find(c => c.value === activeType)?.label}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="card-header">
          <h3 className="card-title">Daftar {KOMPONEN_TYPES.find(c => c.value === activeType)?.label}</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Tambah {KOMPONEN_TYPES.find(c => c.value === activeType)?.label}
          </button>
        </div>

        {filteredComponents.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada {KOMPONEN_TYPES.find(c => c.value === activeType)?.label}. Klik "+ Tambah" untuk mulai.</p>
          </div>
        ) : (
          <div>
            {filteredComponents.map((comp) => (
              <div key={comp.id} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">{comp.name}</div>
                  <div className="list-item-subtitle">
                    {comp.size && `Ukuran: ${comp.size}`}
                    {comp.notes && ` • ${comp.notes}`}
                  </div>
                </div>
                <div className="list-item-actions">
                  <span className="font-mono" style={{ marginRight: '16px' }}>
                    {(comp.pricePerUnit || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}/{comp.unit}
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(comp)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(comp.id)}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Komponen' : 'Tambah Komponen Baru'}</h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Nama *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`Contoh: ${activeType === 'botol' ? 'Botol Glass 30ml' : activeType === 'pelarut' ? 'Ethanol 96%' : 'Dus Box Premium'}`}
              />
            </div>

            {activeType === 'botol' && (
              <div className="form-group">
                <label className="form-label">Ukuran</label>
                <select
                  className="form-select"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                >
                  <option value="">Pilih ukuran...</option>
                  {BOTOL_SIZES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Harga per Unit (IDR) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                  placeholder="15000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="pcs">pcs (piece)</option>
                  <option value="ml">ml</option>
                  <option value="liter">liter</option>
                  <option value="box">box</option>
                  <option value="roll">roll</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan..."
              />
            </div>

            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingId ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
