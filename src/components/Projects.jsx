import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function Projects() {
  const { projects, deleteProject, getAllMaterials } = useApp();
  const [filterType, setFilterType] = useState('');

  const allMaterials = getAllMaterials();

  const filteredProjects = useMemo(() => {
    if (!filterType) return projects;
    return projects.filter(p => p.type === filterType);
  }, [projects, filterType]);

  const getProjectTypeLabel = (type) => {
    switch (type) {
      case 'RAW_TO_PERFUME': return 'Raw → Parfum';
      case 'BIBIT_MIX': return 'Mix Bibit';
      case 'BIBIT_TWEAK': return 'Tweak Bibit';
      default: return type;
    }
  };

  const getProjectTypeBadgeClass = (type) => {
    switch (type) {
      case 'RAW_TO_PERFUME': return 'badge-middle';
      case 'BIBIT_MIX': return 'badge-top';
      case 'BIBIT_TWEAK': return 'badge-base';
      default: return 'badge-base';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getMaterialSummary = (materials) => {
    const count = materials.length;
    return `${count} material${count > 1 ? 's' : ''}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">Semua project parfum yang pernah dibuat</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{projects.filter(p => p.type === 'RAW_TO_PERFUME').length}</div>
          <div className="stat-label">Raw Formula</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{projects.filter(p => p.type === 'BIBIT_MIX').length}</div>
          <div className="stat-label">Bibit Mix</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{projects.filter(p => p.type === 'BIBIT_TWEAK').length}</div>
          <div className="stat-label">Bibit Tweak</div>
        </div>
      </div>

      <div className="card">
        <div className="filter-pills" style={{ marginBottom: '24px' }}>
          <button
            className={`filter-pill ${filterType === '' ? 'active' : ''}`}
            onClick={() => setFilterType('')}
          >
            Semua
          </button>
          <button
            className={`filter-pill ${filterType === 'RAW_TO_PERFUME' ? 'active' : ''}`}
            onClick={() => setFilterType('RAW_TO_PERFUME')}
          >
            Raw Formula
          </button>
          <button
            className={`filter-pill ${filterType === 'BIBIT_MIX' ? 'active' : ''}`}
            onClick={() => setFilterType('BIBIT_MIX')}
          >
            Mix Bibit
          </button>
          <button
            className={`filter-pill ${filterType === 'BIBIT_TWEAK' ? 'active' : ''}`}
            onClick={() => setFilterType('BIBIT_TWEAK')}
          >
            Tweaking
          </button>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada project. Buat project baru di menu Formulasi.</p>
          </div>
        ) : (
          <div>
            {filteredProjects.map((project) => (
              <div key={project.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <div>
                    <div className="list-item-title" style={{ fontSize: '18px' }}>{project.name}</div>
                    <div className="list-item-subtitle">
                      <span className={`badge ${getProjectTypeBadgeClass(project.type)}`}>
                        {getProjectTypeLabel(project.type)}
                      </span>
                      {project.inspiration && (
                        <span style={{ marginLeft: '8px' }}>• {project.inspiration}</span>
                      )}
                    </div>
                  </div>
                  <div className="list-item-actions">
                    <span className="text-sm text-secondary">
                      {formatDate(project.createdAt || project.updatedAt)}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (confirm('Hapus project ini?')) deleteProject(project.id);
                      }}
                    >
                      Hapus
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        // Mark project for editing and navigate to appropriate form
                        try { localStorage.setItem('pf_edit_project', project.id); } catch(e){}
                        if (project.type === 'RAW_TO_PERFUME') {
                          window.location.hash = 'formulasi-raw';
                        } else if (project.type === 'BIBIT_MIX' || project.type === 'BIBIT_TWEAK') {
                          window.location.hash = 'formulasi-bibit';
                        } else if (project.type === 'PRODUCTION') {
                          window.location.hash = 'cogs';
                        } else {
                          window.location.hash = 'formulasi-raw';
                        }
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {getMaterialSummary(project.materials || [])}
                  {project.totalMl && ` • ${project.totalMl}ml`}
                </div>

                {project.notes && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {project.notes}
                  </div>
                )}

                {/* Show materials list */}
                {project.materials && project.materials.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {project.materials.slice(0, 5).map((m, i) => {
                      let name = 'Unknown';
                      if (m.isBibit) {
                        // It's a bibit reference
                        name = `Bibit #${m.bibitId?.slice(-4)}`;
                      } else if (m.materialId) {
                        const mat = allMaterials.find(x => x.id === m.materialId);
                        name = mat?.name || m.materialId;
                      }
                      return (
                        <span key={i} className="badge badge-base">
                          {name} {m.percentage ? `${m.percentage}%` : ''}
                        </span>
                      );
                    })}
                    {project.materials.length > 5 && (
                      <span className="text-sm text-secondary">+{project.materials.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}