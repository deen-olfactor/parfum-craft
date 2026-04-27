import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import allMaterialsData from '../data/allMaterials.json';
import seedFormulasData from '../data/seedFormulas.json';
import { seedBibits } from '../data/seedBibits';

const AppContext = createContext();

const STORAGE_KEYS = {
  USER: 'pf_user',
  USER_MATERIALS: 'pf_user_materials',
  USER_STOCKS: 'pf_user_stocks',
  USER_FORMULAS: 'pf_user_formulas',
  PROCESSED_MATERIALS: 'pf_processed_materials',
  BIBITS: 'pf_bibits',
  PROJECTS: 'pf_projects',
};

export const MATERIAL_TYPES = {
  AC: { label: 'Aroma Chemical', color: '#9C27B0' },
  NI: { label: 'Natural Isolate', color: '#2E7D32' },
  EO: { label: 'Essential Oil', color: '#E65100' },
  ABS: { label: 'Absolute', color: '#C2185B' },
  RES: { label: 'Resinoid', color: '#5D4037' },
  CO2: { label: 'CO2 Extract', color: '#00838F' },
  SYN: { label: 'Synthetic', color: '#546E7A' },
  TIN: { label: 'Tincture', color: '#006064' },
  BA: { label: 'Base/Accord', color: '#455A64' },
  ISO: { label: 'Isolate', color: '#7B1FA2' },
  DIL: { label: 'Dilution', color: '#1976D2' },
  DIST: { label: 'Distillate', color: '#388E3C' },
};

export const USAGE_NOTES = {
  Top: { label: 'Top Note', color: '#007AFF' },
  Middle: { label: 'Middle Note', color: '#34C759' },
  Base: { label: 'Base Note', color: '#FF9500' },
};

export const PROCESS_TYPES = {
  TINCTURE: { label: 'Tincture', description: 'Material infused in alcohol/carrier' },
  DILUTION: { label: 'Dilution', description: 'Material diluted in DPG/ethanol/IPM' },
  DISTILLATION: { label: 'Distillation', description: 'Water/steam distilled material' },
};

export const INSPIRATIONS = [
  'Chanel No.5', 'Dior Sauvage', 'La Vie Est Belle', 'Tom Ford Black Orchid',
  'Bleu de Chanel', 'YSL Black Opium', 'Jo Malone English Pear', 'Viktor&Rolf Flowerbomb',
  'Dolce Gabbana Light Blue', 'Guerlain Shalimar', 'Tom Ford Oud Wood', 'Creed Aventus',
  'Calvin Klein CK One', 'Issey Miyake L\'Eau d\'Issey', 'Creed Virgin Island Water',
  'Diptyque Philosykos', 'Byredo Gypsy Water', 'Le Labo Santal 33', 'Aesop Hwyl',
  'Custom / Original'
];

export const PROJECT_TYPES = {
  RAW_TO_PERFUME: { label: 'Raw → Parfum', description: 'Buat parfum dari raw materials' },
  BIBIT_MIX: { label: 'Mix Bibit', description: 'Mix beberapa bibit parfum jadi' },
  BIBIT_TWEAK: { label: 'Tweak Bibit', description: 'Tweak bibit dengan raw materials' },
};

export const USD_TO_IDR = 15800; // Default exchange rate, can be updated

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbMaterials, setDbMaterials] = useState([]);
  const [userMaterials, setUserMaterials] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [processedMaterials, setProcessedMaterials] = useState([]);
  const [bibits, setBibits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const savedUserMaterials = localStorage.getItem(STORAGE_KEYS.USER_MATERIALS);
      const savedStocks = localStorage.getItem(STORAGE_KEYS.USER_STOCKS);
      const savedFormulas = localStorage.getItem(STORAGE_KEYS.USER_FORMULAS);
      const savedProcessed = localStorage.getItem(STORAGE_KEYS.PROCESSED_MATERIALS);
      const savedBibits = localStorage.getItem(STORAGE_KEYS.BIBITS);
      const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);

      // Load database materials
      setDbMaterials(allMaterialsData);

      // Load seed formulas
      setFormulas(seedFormulasData);

      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedUserMaterials) setUserMaterials(JSON.parse(savedUserMaterials));
      if (savedStocks) setStocks(JSON.parse(savedStocks));
      if (savedFormulas) setFormulas(prev => [...seedFormulasData, ...JSON.parse(savedFormulas)]);
      if (savedProcessed) setProcessedMaterials(JSON.parse(savedProcessed));
      if (savedBibits) setBibits(prev => [...seedBibits, ...JSON.parse(savedBibits)]);
      else setBibits(seedBibits);
      if (savedProjects) setProjects(JSON.parse(savedProjects));
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  // Auth
  const saveUser = (userData) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  };

  // All materials (db + user + processed)
  const getAllMaterials = useCallback(() => {
    return [
      ...dbMaterials,
      ...userMaterials,
      ...processedMaterials,
    ];
  }, [dbMaterials, userMaterials, processedMaterials]);

  const getMaterialById = useCallback((id) => {
    return getAllMaterials().find(m => m.id === id);
  }, [getAllMaterials]);

  const getMaterialByName = useCallback((name) => {
    return getAllMaterials().find(m => m.name.toLowerCase() === name.toLowerCase());
  }, [getAllMaterials]);

  // User Materials CRUD
  const addUserMaterial = (material) => {
    const newMaterial = {
      ...material,
      id: 'um' + Date.now(),
      isUserMaterial: true,
      createdAt: new Date().toISOString()
    };
    const updated = [...userMaterials, newMaterial];
    localStorage.setItem(STORAGE_KEYS.USER_MATERIALS, JSON.stringify(updated));
    setUserMaterials(updated);
    return newMaterial;
  };

  const updateUserMaterial = (id, updates) => {
    const updated = userMaterials.map(m => m.id === id ? { ...m, ...updates } : m);
    localStorage.setItem(STORAGE_KEYS.USER_MATERIALS, JSON.stringify(updated));
    setUserMaterials(updated);
  };

  const deleteUserMaterial = (id) => {
    const updated = userMaterials.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.USER_MATERIALS, JSON.stringify(updated));
    setUserMaterials(updated);
  };

  // Processed Materials (Tincture/Dilution/Distillate)
  const addProcessedMaterial = (processed) => {
    const newMat = {
      ...processed,
      id: 'pm' + Date.now(),
      type: processed.processType || 'TINCTURE',
      isProcessed: true,
      createdAt: new Date().toISOString()
    };
    const updated = [...processedMaterials, newMat];
    localStorage.setItem(STORAGE_KEYS.PROCESSED_MATERIALS, JSON.stringify(updated));
    setProcessedMaterials(updated);

    // Also add to user materials for easy access in formulas
    const asUserMaterial = {
      id: newMat.id,
      name: newMat.name,
      type: newMat.type,
      odor: newMat.odor || [],
      usage: newMat.usage || 'Base',
      notes: newMat.notes || '',
      pricePerUnit: newMat.pricePerUnit || 0,
      isProcessed: true,
      parentMaterialId: newMat.parentMaterialId,
      concentration: newMat.concentration,
      solvent: newMat.solvent,
      processType: newMat.processType,
    };
    addUserMaterial(asUserMaterial);

    return newMat;
  };

  const deleteProcessedMaterial = (id) => {
    const updated = processedMaterials.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROCESSED_MATERIALS, JSON.stringify(updated));
    setProcessedMaterials(updated);
  };

  // Stocks
  const addStock = (stock) => {
    const existing = stocks.find(s => s.materialId === stock.materialId);
    let updated;
    if (existing) {
      const totalQty = existing.quantity + stock.quantity;
      const totalCost = (existing.quantity * existing.purchasePrice) + (stock.quantity * stock.purchasePrice);
      updated = stocks.map(s => s.materialId === stock.materialId
        ? { ...s, quantity: totalQty, purchasePrice: totalCost / totalQty }
        : s);
    } else {
      updated = [...stocks, { ...stock, id: 'st' + Date.now(), purchaseDate: new Date().toISOString() }];
    }
    localStorage.setItem(STORAGE_KEYS.USER_STOCKS, JSON.stringify(updated));
    setStocks(updated);
  };

  const updateStock = (materialId, quantity) => {
    const updated = stocks.map(s => s.materialId === materialId ? { ...s, quantity } : s);
    localStorage.setItem(STORAGE_KEYS.USER_STOCKS, JSON.stringify(updated));
    setStocks(updated);
  };

  const getStock = (materialId) => stocks.find(s => s.materialId === materialId);

  // Formulas (base accords from db + user)
  const saveFormula = (formula) => {
    const newFormula = {
      ...formula,
      id: formula.id || 'uf' + Date.now(),
      createdAt: formula.createdAt || new Date().toISOString()
    };

    // Check if updating existing user formula or adding new
    const existingIndex = formulas.findIndex(f => f.id === newFormula.id && f.id.startsWith('uf'));
    let updated;

    if (existingIndex >= 0) {
      updated = formulas.map((f, i) => i === existingIndex ? newFormula : f);
    } else {
      updated = [...formulas, newFormula];
    }

    localStorage.setItem(STORAGE_KEYS.USER_FORMULAS, JSON.stringify(updated.filter(f => f.id.startsWith('uf'))));
    setFormulas(updated);
    return newFormula;
  };

  const deleteFormula = (id) => {
    // Don't delete seed formulas (id starts with 'f' not 'uf')
    if (!id.startsWith('uf')) return;
    const updated = formulas.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.USER_FORMULAS, JSON.stringify(updated.filter(f => f.id.startsWith('uf'))));
    setFormulas(updated);
  };

  // Bibits
  const addBibit = (bibit) => {
    const newBibit = { ...bibit, id: 'bib' + Date.now(), createdAt: new Date().toISOString() };
    const updated = [...bibits, newBibit];
    localStorage.setItem(STORAGE_KEYS.BIBITS, JSON.stringify(updated));
    setBibits(updated);
    return newBibit;
  };

  const updateBibit = (id, updates) => {
    const updated = bibits.map(b => b.id === id ? { ...b, ...updates } : b);
    localStorage.setItem(STORAGE_KEYS.BIBITS, JSON.stringify(updated));
    setBibits(updated);
  };

  const deleteBibit = (id) => {
    const updated = bibits.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BIBITS, JSON.stringify(updated));
    setBibits(updated);
  };

  // Projects (Perfume formulations)
  const saveProject = (project) => {
    const newProject = {
      ...project,
      id: project.id || 'proj' + Date.now(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = projects.findIndex(p => p.id === newProject.id);
    let updated;

    if (existingIndex >= 0) {
      updated = projects.map((p, i) => i === existingIndex ? newProject : p);
    } else {
      updated = [newProject, ...projects];
    }

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
    setProjects(updated);
    return newProject;
  };

  const deleteProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
    setProjects(updated);
  };

  const getProject = (id) => projects.find(p => p.id === id);

  // COGS Calculation
  const calculateCOGS = useCallback((materials, totalMl = 100) => {
    let totalCost = 0;
    const breakdown = [];

    materials.forEach(pm => {
      const material = getMaterialById(pm.materialId);
      if (material) {
        const pricePerUnit = material.pricePerUnit || material.pricePerGram || 0;
        const amount = (pm.percentage / 100) * totalMl;
        const cost = amount * pricePerUnit;
        totalCost += cost;
        breakdown.push({
          materialId: pm.materialId,
          name: material.name,
          percentage: pm.percentage,
          amount,
          pricePerUnit,
          cost,
          type: material.type,
        });
      } else {
        // Try to find by name if materialId doesn't match
        const matByName = getMaterialByName(pm.materialName || pm.name);
        if (matByName) {
          const pricePerUnit = matByName.pricePerUnit || 0;
          const amount = (pm.percentage / 100) * totalMl;
          const cost = amount * pricePerUnit;
          totalCost += cost;
          breakdown.push({
            materialId: matByName.id,
            name: matByName.name,
            percentage: pm.percentage,
            amount,
            pricePerUnit,
            cost,
            type: matByName.type,
          });
        }
      }
    });

    return { totalCost, breakdown, costPerMl: totalCost / totalMl };
  }, [getMaterialById, getMaterialByName]);

  const value = {
    user,
    dbMaterials,
    userMaterials,
    processedMaterials,
    stocks,
    formulas,
    bibits,
    projects,
    loading,
    inspirations: INSPIRATIONS,
    projectTypes: PROJECT_TYPES,
    processTypes: PROCESS_TYPES,
    materialTypes: MATERIAL_TYPES,
    usageNotes: USAGE_NOTES,
    exchangeRate: USD_TO_IDR,
    saveUser,
    logout,
    getAllMaterials,
    getMaterialById,
    getMaterialByName,
    addUserMaterial,
    updateUserMaterial,
    deleteUserMaterial,
    addProcessedMaterial,
    deleteProcessedMaterial,
    addStock,
    updateStock,
    getStock,
    saveFormula,
    deleteFormula,
    addBibit,
    updateBibit,
    deleteBibit,
    saveProject,
    deleteProject,
    getProject,
    calculateCOGS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}