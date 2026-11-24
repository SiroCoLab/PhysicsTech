import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useMatches, useNavigate } from 'react-router';
import { Icon } from '../components/ui/Icon';
import { Sprite } from '../components/ui/Sprite';
import { Calculator } from '../features/calculator/Calculator';
import { useAccount } from '../features/account/account';
import { useProgress } from '../features/progress/store';
import { ru } from '../i18n/ru';
import './shell.css';

export interface RouteHandle {
  title?: string;
  back?: string; // parent route for the back button
  focus?: boolean; // full-screen task mode: no tab bar
  home?: boolean;
}

interface NavItem { to: string; icon: string; label: string; end?: boolean }
const TABS: NavItem[] = [
  { to: '/', icon: 'home', label: ru.nav.home, end: true },
  { to: '/path', icon: 'path', label: ru.nav.path },
  { to: '/practice', icon: 'practice', label: ru.nav.practice },
  { to: '/exam', icon: 'exam', label: ru.nav.exam },
  { to: '/profile', icon: 'profile', label: ru.nav.profile },
];
const MORE: NavItem[] = [
  { to: '/progress', icon: 'progress', label: ru.nav.progress },
  { to: '/problems', icon: 'problems', label: ru.nav.problems },
  { to: '/errors', icon: 'errors', label: ru.nav.errors },
  { to: '/formulas', icon: 'formulas', label: ru.nav.formulas },
];

export function AppShell() {
  const matches = useMatches();
  const handle = (matches[matches.length - 1]?.handle || {}) as RouteHandle;
  const nav = useNavigate();
  const loc = useLocation();
  const acc = useAccount();
  const st = useProgress();
  const errCount = st.err.length;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  useEffect(() => {
    document.title = handle.title ? `${handle.title} — ${ru.app.name}` : ru.app.docTitle;
  }, [handle.title]);

  const back = () => {
    if (window.history.length > 1 && (window.history.state?.idx ?? 0) > 0) nav(-1);
    else nav(handle.back || '/');
  };

  return (
    <div className={'shell' + (handle.focus ? ' focus' : '')}>
      <Sprite />
      <aside className="side" aria-label={ru.nav.main}>
        <div className="side-brand">
          <img src="./logo.webp" alt={ru.app.logoAlt} />
          <div><b>{ru.app.name}</b><small>{ru.app.university}</small></div>
        </div>
        <nav>
          {[...TABS, ...MORE].map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className="side-link">
              <Icon name={t.icon} />
              <span>{t.label}</span>
              {t.to === '/errors' && errCount > 0 && <i className="count">{errCount}</i>}
            </NavLink>
          ))}
          {acc.me?.is_admin && (
            <NavLink to="/admin" className="side-link"><Icon name="users" /><span>{ru.nav.admin}</span></NavLink>
          )}
        </nav>
      </aside>

      <div className="main">
        {acc.mode === 'mock' && <div className="demo-banner" role="status">{ru.app.demoBanner}</div>}
        {!handle.home && (
          <header className="topbar">
            <button className="topbar-back" onClick={back} aria-label={ru.nav.back}><Icon name="back" /></button>
            <div className="topbar-title"><small>{ru.app.name}</small>{handle.title}</div>
            <img className="topbar-logo" src="./logo.webp" alt={ru.app.logoAlt} />
          </header>
        )}
        <main className="content" key={loc.pathname}>
          <Outlet />
          <footer className="foot">{ru.app.footer}</footer>
        </main>
      </div>

      {!handle.focus && (
        <nav className="tabbar" aria-label={ru.nav.main}>
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className="tab">
              <Icon name={t.icon} />
              <span>{t.label}</span>
              {t.to === '/practice' && errCount > 0 && <i className="count">{errCount}</i>}
            </NavLink>
          ))}
        </nav>
      )}
      <Calculator raised={!handle.focus} />
    </div>
  );
}
