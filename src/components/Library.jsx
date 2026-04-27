import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function Library() {
  const { dbMaterials, userMaterials, processedMaterials, stocks, addUserMaterial, deleteUserMaterial, addStock, getStock } = useApp();
  const [activeTab, setActiveTab] = useState('database');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedMaterialForStock, setSelectedMaterialForStock] = useState(null);

  const [newMaterial, setNewMaterial] = useState({
    name: '', cas: '', type: 'Aroma Chemical', odor: '', usage: 'Base',
    pricePerUnit: '', notes: ''
  });

  const allMaterials = useMemo(() => [...dbMaterials, ...userMaterials, ...processedMaterials], [dbMaterials, userMaterials, processedMaterials]);

  const filteredMaterials = useMemo(() => {
    return allMaterials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.odor?.some(o => o.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = !typeFilter || m.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [allMaterials, searchTerm, typeFilter]);

  const getStockForMaterial = (materialId) => {
    return stocks.find(s => s.materialId === materialId);
  };

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.pricePerUnit) {
      alert('Nama dan harga harus diisi');
      return;
    }
    addUserMaterial({
      ...newMaterial,
      odor: newMaterial.odor.split(',').map(s => s.trim()),
      pricePerUnit: parseFloat(newMaterial.pricePerUnit),
    });
    setShowAddModal(false);
    setNewMaterial({ name: '', cas: '', type: 'Aroma Chemical', odor: '', usage: 'Base', pricePerUnit: '', notes: '' });
  };

  const openStockModal = (material) => {
    setSelectedMaterialForStock(material);
    setShowStockModal(true);
  };

  const handleAddStock = (materialId, quantity, price) => {
    addStock({ materialId, quantity: parseFloat(quantity), purchasePrice: parseFloat(price) });
    setShowStockModal(false);
    setSelectedMaterialForStock(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Library</h1>
        <p className="page-subtitle">Database bahan dan inventory</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{dbMaterials.length}</div>
          <div className="stat-label">Database</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{userMaterials.length}</div>
          <div className="stat-label">User Materials</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{processedMaterials.length}</div>
          <div className="stat-label">Processed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stocks.length}</div>
          <div className="stat-label">In Stock</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
            Database ({dbMaterials.length})
          </button>
          <button className={`tab ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>
            User Materials ({userMaterials.length})
          </button>
          <button className={`tab ${activeTab === 'processed' ? 'active' : ''}`} onClick={() => setActiveTab('processed')}>
            Processed ({processedMaterials.length})
          </button>
        </div>

        <div className="search-box" style={{ marginBottom: '16px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Cari nama atau odor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {['', 'Aroma Chemical', 'Natural Isolate', 'Essential Oil', 'Absolute', 'Resinoid', 'CO2 Extract', 'Synthetic', 'Tincture', 'Dilution', 'Base/Accord'].map(t => (
            <button
              key={t}
              className={`filter-pill ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
            >
              {t || 'All'}
            </button>
          ))}
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Type</th>
              <th>Odor</th>
              <th>Usage</th>
              <th>Price</th>
              <th>Stock</th>
              {activeTab === 'user' && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.slice(0, 50).map((material) => {
              const stock = getStockForMaterial(material.id);
              return (
                <tr key={material.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{material.name}</div>
                    {material.parentMaterialName && (
                      <div className="text-sm text-secondary">from: {material.parentMaterialName}</div>
                    )}
                  </td>
                  <td><span className={`badge badge-${material.type?.toLowerCase()?.slice(0,2)}`}>{material.type}</span></td>
                  <td className="text-sm">{material.odor?.slice(0, 2).join(', ')}</td>
                  <td><span className={`badge badge-${material.usage?.toLowerCase()}`}>{material.usage}</span></td>
                  <td className="font-mono">
                    {material.pricePerUnit
                      ? `${material.pricePerUnit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}/ml`
                      : '-'}
                  </td>
                  <td>
                    {stock ? (
                      <span className="font-mono">{stock.quantity.toFixed(1)} ml</span>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => openStockModal(material)}>+ Stock</button>
                    )}
                  </td>
                  {activeTab === 'user' && (
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteUserMaterial(material.id)}>Hapus</button></td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredMaterials.length > 50 && (
          <p className="text-center text-secondary" style={{ padding: '16px' }}>
            Menampilkan 50 dari {filteredMaterials.length} bahan
          </p>
        )}

        {activeTab === 'user' && (
          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => setShowAddModal(true)}>
            + Tambah Material
          </button>
        )}
      </div>

      {/* ADD MATERIAL MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Material</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">Nama *</label>
              <input type="text" className="form-input" value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={newMaterial.type}
                  onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}>
                  <option>Aroma Chemical</option>
                  <option>Natural Isolate</option>
                  <option>Essential Oil</option>
                  <option>Absolute</option>
                  <option>Resinoid</option>
                  <option>Synthetic</option>
                  <option>Tincture</option>
                  <option>Dilution</option>
                  <option>Base/Accord</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Usage</label>
                <select className="form-select" value={newMaterial.usage}
                  onChange={(e) => setNewMaterial({ ...newMaterial, usage: e.target.value })}>
                  <option value="Top">Top Note</option>
                  <option value="Middle">Middle Note</option>
                  <option value="Base">Base Note</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Odor Profile (comma separated)</label>
              <input type="text" className="form-input" value={newMaterial.odor}
                onChange={(e) => setNewMaterial({ ...newMaterial, odor: e.target.value })}
                placeholder="floral, jasmine, sweet" />
            </div>
            <div className="form-group">
              <label className="form-label">Harga per ml (IDR) *</label>
              <input type="number" className="form-input" value={newMaterial.pricePerUnit}
                onChange={(e) => setNewMaterial({ ...newMaterial, pricePerUnit: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={newMaterial.notes}
                onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })} />
            </div>
            <button className="btn btn-primary" onClick={handleAddMaterial}>Tambah</button>
          </div>
        </div>
      )}

      {/* ADD STOCK MODAL */}
      {showStockModal && selectedMaterialForStock && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <StockModal material={selectedMaterialForStock} onAdd={handleAddStock} onClose={() => setShowStockModal(false)} />
        </div>
      )}
    </div>
  );
}

function StockModal({ material, onAdd, onClose }) {
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  return (
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3 className="modal-title">Tambah Stock</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <p style={{ marginBottom: '16px' }}>{material.name}</p>
      <div className="form-group">
        <label className="form-label">Jumlah (ml)</label>
        <input type="number" className="form-input" value={quantity}
          onChange={(e) => setQuantity(e.target.value)} placeholder="100" />
      </div>
      <div className="form-group">
        <label className="form-label">Harga Total (IDR)</label>
        <input type="number" className="form-input" value={price}
          onChange={(e) => setPrice(e.target.value)} placeholder="500000" />
      </div>
      {quantity && price && (
        <p className="text-sm text-secondary" style={{ marginBottom: '16px' }}>
          Harga per ml: {(parseFloat(price) / parseFloat(quantity)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
        </p>
      )}
      <button className="btn btn-primary" onClick={() => onAdd(material.id, quantity, price)}>Simpan</button>
    </div>
  );
}