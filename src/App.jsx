import { AppProvider, useApp } from './context/AppContext';
import Auth from './components/Auth';
import Header from './components/Header';
import Formulasi from './components/Formulasi';
import FormulasiRaw from './components/FormulasiRaw';
import FormulasiTincture from './components/FormulasiTincture';
import FormulasiBibit from './components/FormulasiBibit';
import Library from './components/Library';
import BibitParfum from './components/BibitParfum';
import HitungCOGS from './components/HitungCOGS';
import Projects from './components/Projects';
import './styles.css';

function AppContent() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="auth-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const hash = window.location.hash.replace('#', '') || 'formulasi';
  const [mainRoute, subRoute] = hash.split('-');

  const renderMainContent = () => {
    switch (mainRoute) {
      case 'formulasi':
        if (subRoute === 'raw') return <FormulasiRaw />;
        if (subRoute === 'tincture') return <FormulasiTincture />;
        if (subRoute === 'bibit') return <FormulasiBibit />;
        return <Formulasi />;
      case 'library':
        return <Library />;
      case 'bibit':
        return <BibitParfum />;
      case 'cogs':
        return <HitungCOGS />;
      case 'projects':
        return <Projects />;
      default:
        return <Formulasi />;
    }
  };

  return (
    <div className="app">
      <Header activeMain={mainRoute} activeSub={subRoute} />
      <main className="main-content">
        {renderMainContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}