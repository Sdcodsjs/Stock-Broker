import type { User } from '../types';

interface NavbarProps {
  user: User;
  connected: boolean;
  onLogout: () => void;
}

export function Navbar({ user, connected, onLogout }: NavbarProps) {
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a className="navbar-brand" href="#">
          <div className="navbar-brand-icon">📈</div>
          <span className="navbar-brand-text">TradeDesk</span>
        </a>

        <div className="navbar-right">
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            <span className="dot" />
            {connected ? 'Live' : 'Disconnected'}
          </div>

          <div className="navbar-user">
            <div className="user-avatar">{initials}</div>
            <span className="user-email">{user.email}</span>
          </div>

          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
