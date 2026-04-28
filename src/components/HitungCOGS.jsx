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
  { value: 'custom', label: 'Custom...' },
];

export default function HitungCOGS() {
  const { projects, formulas, bibits, components, calculateCOGS, saveProject } = useApp();

  // Project selection
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [useBibitMix, setUseBibitMix] = useState(false);
  const [selectedBibitId, setSelectedBibitId] = useState('');

  // Production params
  const [brandName, setBrandName] = useState('');
  const [variantName, setVariantName] = useState('');
  const [batchSize, setBatchSize] = useState(100);
  const [bottleSize, setBottleSize] = useState(50);
  const [concentration, setConcentration] = useState(15); // can be number or 'custom'
  const [customConcentration, setCustomConcentration] = useState(15);

  // Component selections
  const [selectedBottleId, setSelectedBottleId] = useState('');
  const [selectedSolventId, setSelectedSolventId] = useState('');
  const [selectedPackagingId, setSelectedPackagingId] = useState('');
  const [selectedStickerId, setSelectedStickerId] = useState('');

  // Bibit search
  const [bibitSearch, setBibitSearch] = useState('');

  // Map seed formulas into project-like objects so they can be selected
  const mappedFormulas = useMemo(() => {
    if (!formulas || !Array.isArray(formulas)) return [];
    return formulas
      .filter(f => Array.isArray(f.ingredients) && f.ingredients.length > 0)
      .map(f => ({
        id: f.id,
        name: f.name,
        type: 'RAW_TO_PERFUME',
        materials: f.ingredients.map(i => ({ materialName: i.materialName || i.name, percentage: i.percentage }))
      }));
  }, [formulas]);

  const combinedRawProjects = useMemo(() => {
    const fromProjects = projects.filter(p => p.type === 'RAW_TO_PERFUME');
    return [...fromProjects, ...mappedFormulas];
  }, [projects, mappedFormulas]);

  const bibitMixProjects = useMemo(() => projects.filter(p => p.type === 'BIBIT_MIX'), [projects]);

  const selectedProject = useMemo(() => {
    return [...projects, ...mappedFormulas].find(p => p.id === selectedProjectId);
  }, [projects, mappedFormulas, selectedProjectId]);

  const selectedBibit = bibits.find(b => b.id === selectedBibitId);

  // Get components by type
  const bottles = components.filter(c => c.type === 'botol');
  const solvents = components.filter(c => c.type === 'pelarut');
  const packagings = components.filter(c => c.type === 'packaging');
  const stickers = components.filter(c => c.type === 'sticker');

  // Filtered bibits
  const filteredBibits = useMemo(() => {
    if (!bibitSearch) return bibits.slice(0, 20);
    return bibits.filter(b =>
      b.name.toLowerCase().includes(bibitSearch.toLowerCase())
    ).slice(0, 20);
  }, [bibits, bibitSearch]);

  // Determine effective concentration number
  const effectiveConcentration = useMemo(() => {
    if (concentration === 'custom') return parseFloat(customConcentration) || 0;
    return parseFloat(concentration) || 0;
  }, [concentration, customConcentration]);

  // Calculate amounts
  const concentratePerBottle = (bottleSize * effectiveConcentration) / 100;
  const totalConcentrate = concentratePerBottle * batchSize;
  const totalVolume = batchSize * bottleSize;
  const solventPerBottle = bottleSize - concentratePerBottle;
  const totalSolvent = solventPerBottle * batchSize;

  // Concentrate cost — calculate directly for the totalConcentrate (ml)
  const rawMaterialCost = useMemo(() => {
    if (useBibitMix || !selectedProject || selectedProject.type !== 'RAW_TO_PERFUME') return 0;
    if (!selectedProject.materials || selectedProject.materials.length === 0) return 0;
    // calculateCOGS expects materials with materialId or materialName and a total ml argument
    const result = calculateCOGS(selectedProject.materials, totalConcentrate || 100);
    return result.totalCost || 0;
  }, [useBibitMix, selectedProject, totalConcentrate, calculateCOGS]);

  // Bibit cost
  const bibitCost = useMemo(() => {
    if (!useBibitMix) return 0;
    if (selectedBibit) {
      return totalConcentrate * (selectedBibit.pricePerMl || 0);
    }
    if (selectedProject && selectedProject.type === 'BIBIT_MIX') {
      // Sum cost per ml of the mix definition, then multiply by totalConcentrate
      let totalPer100mlCost = 0;
      selectedProject.materials?.forEach(m => {
        if (m.isBibit && m.bibitId) {
          const b = bibits.find(x => x.id === m.bibitId);
          if (b) totalPer100mlCost += (m.percentage / 100) * (b.pricePerMl || 0) * 100;
        }
      });
      // totalPer100mlCost is cost for 100ml, scale to totalConcentrate
      return (totalPer100mlCost / 100) * totalConcentrate;
    }
    return 0;
  }, [useBibitMix, selectedBibit, selectedProject, totalConcentrate, bibits]);

  // Component costs
  const bottleComp = bottles.find(c => c.id === selectedBottleId);
  const solventComp = solvents.find(c => c.id === selectedSolventId);
  const packagingComp = packagings.find(c => c.id === selectedPackagingId);
  const stickerComp = stickers.find(c => c.id === selectedStickerId);

  // Assume solvent.pricePerUnit is per liter; convert ml -> liter
  const solventCost = solventComp ? (totalSolvent / 1000) * (solventComp.pricePerUnit || 0) : 0;
  const bottleCost = bottleComp ? (batchSize * (bottleComp.pricePerUnit || 0)) : 0;
  const packagingCost = packagingComp ? (batchSize * (packagingComp.pricePerUnit || 0)) : 0;
  const stickerCost = stickerComp ? (batchSize * (stickerComp.pricePerUnit || 0)) : 0;

  // Total COGS
  const totalCOGS = rawMaterialCost + bibitCost + solventCost + bottleCost + packagingCost + stickerCost;
  const costPerBottle = batchSize > 0 ? totalCOGS / batchSize : 0;
  const costPerMl = totalVolume > 0 ? totalCOGS / totalVolume : 0;

  const handleReset = () => {
    setSelectedProjectId('');
    setUseBibitMix(false);
    setSelectedBibitId('');
    setBrandName('');
    setVariantName('');
    setBatchSize(100);
    setBottleSize(50);
    setConcentration(15);
    setCustomConcentration(15);
    setSelectedBottleId('');
    setSelectedSolventId('');
    setSelectedPackagingId('');
    setSelectedStickerId('');
    setBibitSearch('');
  };

  const handleSaveToProjects = () => {
    if (!brandName && !variantName) {
      alert('Masukkan Nama Brand atau Nama Varian');
      return;
    }
    if (!selectedProjectId && !selectedBibitId) {
      alert('Pilih formula atau bibit');
      return;
    }

    const projectName = brandName && variantName
      ? `${brandName} - ${variantName}`
      : brandName || variantName || 'Production Run';

    const productionProject = {
      name: projectName,
      type: 'PRODUCTION',
      brandName,
      variantName,
      sourceProjectId: selectedProjectId,
      sourceBibitId: selectedBibitId,
      useBibitMix,
      batchSize,
      bottleSize,
      concentration: effectiveConcentration,
      bottleId: selectedBottleId,
      solventId: selectedSolventId,
      packagingId: selectedPackagingId,
      stickerId: selectedStickerId,
      totalVolume,
      concentratePerBottle,
      totalConcentrate,
      totalSolvent,
      totalCOGS,
      costPerBottle,
      costPerMl,
      components: {
        bottle: bottleComp ? { id: bottleComp.id, name: bottleComp.name, price: bottleComp.pricePerUnit } : null,
        solvent: solventComp ? { id: solventComp.id, name: solventComp.name, price: solventComp.pricePerUnit } : null,
        packaging: packagingComp ? { id: packagingComp.id, name: packagingComp.name, price: packagingComp.pricePerUnit } : null,
        sticker: stickerComp ? { id: stickerComp.id, name: stickerComp.name, price: stickerComp.pricePerUnit } : null,
      },
      createdAt: new Date().toISOString(),
    };

    saveProject(productionProject);
    alert('Production run disimpan ke Projects!');
    handleReset();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kalkulator Produksi</h1>
        <p className="page-subtitle">Hitung COGS untuk produksi parfum batch dan simpan sebagai project</p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Informasi Produksi</h3>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Nama Brand</label>
            <input
              type="text"
              className="form-input"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Contoh: Maison Noir"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nama Varian</label>
            <input
              type="text"
              className="form-input"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="Contoh: Midnight Oud"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Pilih Formula</h3>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Formula (Raw Material)</label>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setUseBibitMix(false);
                setSelectedBibitId('');
              }}
            >
              <option value="">Pilih formula...</option>
              <optgroup label="Raw Material Formula">
                {combinedRawProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
              <optgroup label="Bibit Mix Formula">
                {bibitMixProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Atau Gunakan Bibit Tunggal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input
                type="checkbox"
                id="useBibitMix"
                checked={useBibitMix}
                onChange={(e) => {
                  setUseBibitMix(e.target.checked);
                  if (e.target.checked) setSelectedProjectId('');
                }}
              />
              <label htmlFor="useBibitMix">Pakai Bibit Tunggal</label>
            </div>
          </div>
        </div>

        {useBibitMix && (
          <div className="form-group">
            <label className="form-label">Cari Bibit</label>
            <div className="search-box" style={{ marginBottom: '8px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Ketik nama bibit..."
                value={bibitSearch}
                onChange={(e) => setBibitSearch(e.target.value)}
              />
            </div>
            {bibitSearch && filteredBibits.length > 0 && (
              <select
                className="form-select"
                value={selectedBibitId}
                onChange={(e) => setSelectedBibitId(e.target.value)}
              >
                <option value="">Pilih bibit...</option>
                {filteredBibits.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} - {b.pricePerMl?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/ml
                  </option>
                ))}
              </select>
            )}
            {selectedBibit && (
              <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600 }}>{selectedBibit.name}</div>
                <div className="text-sm text-secondary">
                  {selectedBibit.pricePerMl?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/ml
                  {selectedBibit.reference && ` - Ref: ${selectedBibit.reference}`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Parameter Produksi</h3>

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
              onChange={(e) => setConcentration(e.target.value)}
            >
              {CONCENTRATION_TYPES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {concentration === 'custom' && (
              <input
                type="number"
                className="form-input" 
                style={{ marginTop: '8px' }}
                value={customConcentration}
                onChange={(e) => setCustomConcentration(e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            )}
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
                <option key={b.id} value={b.id}>
                  {b.name} - {b.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/pcs
                </option>
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
                <option key={s.id} value={s.id}>
                  {s.name} - {s.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/liter
                </option>
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
                <option key={p.id} value={p.id}>
                  {p.name} - {p.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/pcs
                </option>
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
                <option key={s.id} value={s.id}>
                  {s.name} - {s.pricePerUnit?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}/pcs
                </option>
              ))}
            </select>
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
              <span>{useBibitMix ? (selectedBibit ? 'Bibit Tunggal' : 'Bibit Mix') : 'Raw Materials'}</span>
              <span className="font-mono">
                {(useBibitMix ? bibitCost : rawMaterialCost).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
              </span>
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

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={handleSaveToProjects}>
              Simpan ke Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
