import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function BibitParfum() {
  const { bibits, addBibit, updateBibit, deleteBibit } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingBibit, setEditingBibit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    odorProfile: '',
    pricePerMl: '',
    recommendedDilution: ''
  });

  const filteredBibits = useMemo(() => {
    let result = bibits;
    if (filterCategory !== 'ALL') {
      result = result.filter(b => b.category === filterCategory);
    }
    if (!searchTerm) return result;
    return result.filter(b =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.odorProfile?.some(o => o.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [bibits, searchTerm, filterCategory]);

  const resetForm = () => {
    setFormData({ name: '', brand: '', odorProfile: '', pricePerMl: '', recommendedDilution: '' });
    setEditingBibit(null);
    setShowModal(false);
  };

  const handleEdit = (bibit) => {
    setEditingBibit(bibit.id);
    setFormData({
      name: bibit.name,
      brand: bibit.brand || '',
      odorProfile:bibit.odorProfile?.join(', ') || '',
      pricePerMl: bibit.pricePerMl?.toString() || '',
      recommendedDilution: bibit.recommendedDilution || ''
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.pricePerMl) {
      alert('Nama dan harga harus diisi');
      return;
    }

    const bibitData = {
      name: formData.name,
      brand: formData.brand,
      odorProfile: formData.odorProfile.split(',').map(s => s.trim()).filter(Boolean),
      pricePerMl: parseFloat(formData.pricePerMl),
      recommendedDilution: formData.recommendedDilution
    };

    if (editingBibit) {
      updateBibit(editingBibit, bibitData);
    } else {
      addBibit(bibitData);
    }

    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm('Yakin hapus bibit ini?')) {
      deleteBibit(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bibit Parfum</h1>
        <p className="page-subtitle">Library bibit parfum jadi untuk mixing atau dijual</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{bibits.length}</div>
          <div className="stat-label">Total Bibit</div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h3 className="card-title">Daftar Bibit</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Tambah Bibit
          </button>
        </div>

        <div className="search-box" style={{ marginBottom: '16px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Cari bibit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {['ALL', 'Konsentrat', 'Library', 'Daftar Harga'].map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'ALL' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        {filteredBibits.length === 0 ? (
          <div className="empty-state">
            <p>{bibits.length === 0 ? 'Belum ada bibit. Klik "+ Tambah Bibit" untuk mulai.' : 'Tidak ada hasil pencarian.'}</p>
          </div>
        ) : (
          <div>
            {filteredBibits.map((bibit) => (
              <div key={bibit.id} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">{bibit.name}</div>
                  <div className="list-item-subtitle">
                    {bibit.brand && `Brand: ${bibit.brand}`}
                    {bibit.recommendedDilution && ` • Dilution: ${bibit.recommendedDilution}`}
                  </div>
                  {bibit.odorProfile?.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      {bibit.odorProfile.map((o, i) => (
                        <span key={i} className="badge badge-base" style={{ marginRight: '4px' }}>{o}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="list-item-actions">
                  <span className="font-mono" style={{ marginRight: '16px' }}>
                    {(bibit.pricePerMl || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}/ml
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(bibit)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(bibit.id)}>Hapus</button>
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
              <h3 className="modal-title">{editingBibit ? 'Edit Bibit' : 'Tambah Bibit Baru'}</h3>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Nama *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Base Floral Jasmine Premium"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Brand / Supplier</label>
              <input
                type="text"
                className="form-input"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Contoh: Givaudan, IFF, atau supplier lokal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Odor Profile (comma separated)</label>
              <input
                type="text"
                className="form-input"
                value={formData.odorProfile}
                onChange={(e) => setFormData({ ...formData, odorProfile: e.target.value })}
                placeholder="floral, jasmine, creamy, sweet"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Harga per ml (IDR) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.pricePerMl}
                  onChange={(e) => setFormData({ ...formData, pricePerMl: e.target.value })}
                  placeholder="15000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Recommended Dilution</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.recommendedDilution}
                  onChange={(e) => setFormData({ ...formData, recommendedDilution: e.target.value })}
                  placeholder="10-20%"
                />
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingBibit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}