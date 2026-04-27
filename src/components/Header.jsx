import { useApp } from '../context/AppContext';

export default function Header({ activeMain, activeSub }) {
  const { user, logout } = useApp();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="header">
      <div className="logo">ParfumCraft</div>

      <nav className="nav-tabs">
        <NavTab href="#formulasi" label="Formulasi" active={activeMain === 'formulasi'} />
        <NavTab href="#projects" label="Projects" active={activeMain === 'projects'} />
        <NavTab href="#library" label="Library" active={activeMain === 'library'} />
        <NavTab href="#bibit" label="Bibit Parfum" active={activeMain === 'bibit'} />
        <NavTab href="#cogs" label="COGS" active={activeMain === 'cogs'} />
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
        window.location.hash = href;
      }}
    >
      {label}
    </a>
  );
}