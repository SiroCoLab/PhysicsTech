import { NavLink } from 'react-router';
import { ru } from '../../i18n/ru';

/** Switch between reference sections: formulas, formula practice, trigonometry */
export function RefNav() {
  const items: [string, string][] = [['/formulas', ru.nav.formulas], ['/formulas/lab', ru.nav.formulaLab], ['/trig', ru.nav.trig]];
  return (
    <nav className="chips" aria-label={ru.nav.formulas}>
      {items.map(([to, label]) => (
        <NavLink key={to} to={to} end className={({ isActive }) => 'chip' + (isActive ? ' on' : '')} style={{ textDecoration: 'none' }}>{label}</NavLink>
      ))}
    </nav>
  );
}
