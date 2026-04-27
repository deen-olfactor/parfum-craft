import { useApp } from '../context/AppContext';

export default function Header({ activeMain, activeSub, onNavigate }) {
  const { user, logout } = useApp();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNav = (href) => {
    if (onNavigate) {
      const hash = href.replace('#', '');
      const [main, sub] = hash.split('-');
      onNavigate(main, sub || null);
    } else {
      window.location.hash = href;
    }
  };

  return (
    <header className="header">
      <div className="logo">ParfumCraft</div>

      <nav className="nav-tabs">
        <NavTab href="#formulasi" label="Formulasi" active={activeMain === 'formulasi'} onClick={() => handleNav('#formulasi')} />
        <NavTab href="#projects" label="Projects" active={activeMain === 'projects'} onClick={() => handleNav('#projects')} />
        <NavTab href="#library" label="Library" active={activeMain === 'library'} onClick={() => handleNav('#library')} />
        <NavTab href="#bibit" label="Bibit" active={activeMain === 'bibit'} onClick={() => handleNav('#bibit')} />
        <NavTab href="#komponen" label="Komponen" active={activeMain === 'komponen'} onClick={() => handleNav('#komponen')} />
        <NavTab href="#cogs" label="COGS" active={activeMain === 'cogs'} onClick={() => handleNav('#cogs')} />
      </nav>

      <div className="user-menu">
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user?.name}</span>
        <div className="user-avatar">
          {user ? getInitials(user.name) : '?'}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}

function NavTab({ href, label, active, onClick }) {
  return (
    <a
      href={href}
      className={`nav-tab ${active ? 'active' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
      }}
    >
      {label}
    </a>
  );
}
