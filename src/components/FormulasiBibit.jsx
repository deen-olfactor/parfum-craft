import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const BOTTLE_SIZES = [
  { value: 5, label: '5 ml' },
  { value: 10, label: '10 ml' },
  { value: 20, label: '20 ml' },
  { value: 30, label: '30 ml' },
  { value: 50, label: '50 ml' },
  { value: 100, label: '100 ml' },
];

const CONCENTRATION_TYPES = [
  { value: 8, label: 'EDT (8-12%)' },
  { value: 15, label: 'EDP (15-20%)' },
  { value: 20, label: 'EDP Forte (20-25%)' },
  { value: 30, label: 'Extrait (30-40%)' },
];

export default function FormulasiBibit() {
  const { projects, bibits, getAllMaterials, components, calculateCOGS } = useApp();

  // Production params
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [batchSize, setBatchSize] = useState(100);
  const [bottleSize, setBottleSize] = useState(50);
  const [concentration, setConcentration] = useState(15);
  const [useBibitMix, setUseBibitMix] = useState(false);

  // Component selections
  const [selectedBottleId, setSelectedBottleId] = useState('');
  const [selectedSolventId, setSelectedSolventId] = useState('');
  const [selectedPackagingId, setSelectedPackagingId] = useState('');
  const [selectedStickerId, setSelectedStickerId] = useState('');

  // Bibit selection (if using mix)
  const [selectedBibitId, setSelectedBibitId] = useState('');
  const [bibitPercentage, setBibitPercentage] = useState(30);

  // Search terms
  const [bibitSearch, setBibitSearch] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const allMaterials = getAllMaterials();

  // Get components by type
  const bottles = components.filter(c => c.type === 'botol');
  const solvents = components.filter(c => c.type === 'pelarut');
  const packagings = components.filter(c => c.type === 'packaging');
  const stickers = components.filter(c => c.type === 'sticker');

  // Filtered bibits for search
  const filteredBibits = useMemo(() => {
    if (!bibitSearch) return bibits.slice(0, 20);
    return bibits.filter(b =>
      b.name.toLowerCase().includes(bibitSearch.toLowerCase()) ||
      b.brand?.toLowerCase().includes(bibitSearch.toLowerCase())
    ).slice(0, 20);
  }, [bibits, bibitSearch]);

  // Calculate concentrate amount per bottle
  const concentratePerBottle = (bottleSize * concentration) / 100;
  const totalConcentrate = concentratePerBottle * batchSize;

  // Bibit cost if using mix
  const selectedBibit = bibits.find(b => b.id === selectedBibitId);
  const bibitCost = selectedBibit ? (totalConcentrate * selectedBibit.pricePerMl) : 0;

  // Raw material cost if NOT using mix
  const rawMaterialCost = useMemo(() => {
    if (useBibitMix || !selectedProject) return 0;
    const result = calculateCOGS(selectedProject.materials, 100);
    // Scale to totalConcentrate amount
    return (result.totalCost / 100) * totalConcentrate;
  }, [selectedProject, totalConcentrate, useBibitMix, calculateCOGS]);

  // Component costs
  const bottleComp = bottles.find(c => c.id === selectedBottleId);
  const solventComp = solvents.find(c => c.id === selectedSolventId);
  const packagingComp = packagings.find(c => c.id === selectedPackagingId);
  const stickerComp = stickers.find(c => c.id === selectedStickerId);

  // Solvent calculation (total volume - concentrate)
  const totalVolume = batchSize * bottleSize;
  const solventPerBottle = bottleSize - concentratePerBottle;
  const totalSolvent = solventPerBottle * batchSize;
  const solventCost = solventComp ? (totalSolvent * (solventComp.pricePerUnit / 1000)) : 0; // price per ml

  const bottleCost = bottleComp ? (batchSize * bottleComp.pricePerUnit) : 0;
  const packagingCost = packagingComp ? (batchSize * packagingComp.pricePerUnit) : 0;
  const stickerCost = stickerComp ? (batchSize * stickerComp.pricePerUnit) : 0;

  // Total COGS
  const totalCOGS = rawMaterialCost + bibitCost + solventCost + bottleCost + packagingCost + stickerCost;
  const costPerBottle = totalCOGS / batchSize;
  const costPerMl = totalCOGS / totalVolume;

  const resetForm = () => {
    setSelectedProjectId('');
    setBatchSize(100);
    setBottleSize(50);
    setConcentration(15);
    setUseBibitMix(false);
    setSelectedBibitId('');
    setBibitPercentage(30);
    setSelectedBottleId('');
    setSelectedSolventId('');
    setSelectedPackagingId('');
    setSelectedStickerId('');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kalkulator Produksi</h1>
        <p className="page-subtitle">Hitung COGS untuk produksi parfum batch</p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Parameter Produksi</h3>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Formula ( dari Projects)</label>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Pilih formula...</option>
              {projects.filter(p => p.type === 'RAW_TO_PERFUME').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Atau Gunakan Bibit Mix</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input
                type="checkbox"
                id="useBibitMix"
                checked={useBibitMix}
                onChange={(e) => setUseBibitMix(e.target.checked)}
              />
              <label htmlFor="useBibitMix">Pakai Bibit Mix</label>
            </div>
          </div>
        </div>

        {useBibitMix && (
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Cari Bibit</label>
            <div className="search-box" style={{ marginBottom: '8px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Cari bibit..."
                value={bibitSearch}
                onChange={(e) => setBibitSearch(e.target.value)}
              />
            </div>
            {filteredBibits.length > 0 && (
              <select
                className="form-select"
                value={selectedBibitId}
                onChange={(e) => setSelectedBibitId(e.target.value)}
              >
                <option value="">Pilih bibit...</option>
                {filteredBibits.map(b => (
                  <option key={b.id} value={b.id}>{b.name} - {b.pricePerMl?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/ml</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Jumlah Botol</label>
            <input
              type="number"
              className="form-input"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ukuran Botol</label>
            <select
              className="form-select"
              value={bottleSize}
              onChange={(e) => setBottleSize(parseInt(e.target.value))}
            >
              {BOTTLE_SIZES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Konsentrasi</label>
            <select
              className="form-select"
              value={concentration}
              onChange={(e) => setConcentration(parseInt(e.target.value))}
            >
              {CONCENTRATION_TYPES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Komponen Produksi</h3>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Botol</label>
            <select
              className="form-select"
              value={selectedBottleId}
              onChange={(e) => setSelectedBottleId(e.target.value)}
            >
              <option value="">Pilih botol...</option>
              {bottles.map(b => (
                <option key={b.id} value={b.id}>{b.name} - {b.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/pcs</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Pelarut</label>
            <select
              className="form-select"
              value={selectedSolventId}
              onChange={(e) => setSelectedSolventId(e.target.value)}
            >
              <option value="">Pilih pelarut...</option>
              {solvents.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/ml</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Packaging</label>
            <select
              className="form-select"
              value={selectedPackagingId}
              onChange={(e) => setSelectedPackagingId(e.target.value)}
            >
              <option value="">Pilih packaging...</option>
              {packagings.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/pcs</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sticker/Label</label>
            <select
              className="form-select"
              value={selectedStickerId}
              onChange={(e) => setSelectedStickerId(e.target.value)}
            >
              <option value="">Pilih sticker...</option>
              {stickers.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/pcs</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Rincian Biaya</h3>

        <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <div className="grid-2" style={{ gap: '12px' }}>
            <div>
              <div className="text-sm text-secondary">Total Volume</div>
              <div className="font-mono" style={{ fontSize: '18px' }}>{totalVolume.toLocaleString()} ml</div>
            </div>
            <div>
              <div className="text-sm text-secondary">Concentrate per Bottle</div>
              <div className="font-mono" style={{ fontSize: '18px' }}>{concentratePerBottle.toFixed(2)} ml</div>
            </div>
          </div>
        </div>

        <div className="cost-breakdown">
          <div className="cost-row">
            <span>{useBibitMix ? 'Bibit Mix' : 'Raw Materials'}</span>
            <span className="font-mono">{(useBibitMix ? bibitCost : rawMaterialCost).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
          </div>
          <div className="cost-row">
            <span>Pelarut ({totalSolvent.toFixed(0)} ml)</span>
            <span className="font-mono">{solventCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
          </div>
          <div className="cost-row">
            <span>Botol ({batchSize} pcs)</span>
            <span className="font-mono">{bottleCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
          </div>
          <div className="cost-row">
            <span>Packaging ({batchSize} pcs)</span>
            <span className="font-mono">{packagingCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
          </div>
          <div className="cost-row">
            <span>Sticker ({batchSize} pcs)</span>
            <span className="font-mono">{stickerCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
          </div>
          <div style={{ borderTop: '2px solid var(--border-color)', marginTop: '12px', paddingTop: '12px' }}>
            <div className="cost-row" style={{ fontWeight: 700, fontSize: '18px' }}>
              <span>TOTAL COGS</span>
              <span className="font-mono">{totalCOGS.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--color-primary)', color: 'white', padding: '16px', borderRadius: '8px', marginTop: '16px', textAlign: 'center' }}>
          <div className="text-sm" style={{ opacity: 0.9 }}>Cost per Bottle</div>
          <div className="font-mono" style={{ fontSize: '32px', fontWeight: 700 }}>
            {costPerBottle.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            = {costPerMl.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}/ml
          </div>
        </div>

        <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={resetForm}>
          Reset
        </button>
      </div>
    </div>
  );
}
