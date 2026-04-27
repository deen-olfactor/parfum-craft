import { useState } from 'react';

export default function Formulasi() {
  const [activeTab, setActiveTab] = useState('raw');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Formulasi</h1>
        <p className="page-subtitle">Pilih jenis formulasi yang ingin dibuat</p>
      </div>

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('raw');
              window.location.hash = 'formulasi-raw';
            }}
          >
            Raw Material
          </button>
          <button
            className={`tab ${activeTab === 'tincture' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('tincture');
              window.location.hash = 'formulasi-tincture';
            }}
          >
            Tincture / Dilution
          </button>
          <button
            className={`tab ${activeTab === 'bibit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('bibit');
              window.location.hash = 'formulasi-bibit';
            }}
          >
            Mix / Tweak Bibit
          </button>
        </div>

        <div style={{ padding: '32px', textAlign: 'center' }}>
          {activeTab === 'raw' && (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
              <h3 style={{ marginBottom: '8px' }}>Raw Material → Parfum</h3>
              <p className="text-secondary" style={{ marginBottom: '16px' }}>
                Buat parfum langsung dari raw materials. Pilih bahan, atur persentase, dan buat formula baru.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => window.location.hash = 'formulasi-raw'}
              >
                Mulai Formulasi
              </button>
            </div>
          )}

          {activeTab === 'tincture' && (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚗️</div>
              <h3 style={{ marginBottom: '8px' }}>Proses Material</h3>
              <p className="text-secondary" style={{ marginBottom: '16px' }}>
                Buat tincture, dilution, atau distillate dari material dasar. Hasil akan tersimpan di library user.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => window.location.hash = 'formulasi-tincture'}
              >
                Mulai Proses
              </button>
            </div>
          )}

          {activeTab === 'bibit' && (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧪</div>
              <h3 style={{ marginBottom: '8px' }}>Mix & Tweak Bibit</h3>
              <p className="text-secondary" style={{ marginBottom: '16px' }}>
                Campurkan beberapa bibit parfum jadi, atau tweak bibit dengan raw materials untuk buat parfum baru.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => window.location.hash = 'formulasi-bibit'}
              >
                Mulai Mixing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}