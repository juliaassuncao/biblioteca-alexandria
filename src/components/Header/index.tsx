import { BookOpenText, Menu } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import styles from './styles.module.scss';

export default function Header() {
  return <header className={styles.header}>
    <div className={`container ${styles.inner}`}>
      <Link to="/" className={styles.brand} aria-label="Biblioteca de Alexandria, início">
        <span className={styles.brandSymbol}><BookOpenText size={23} strokeWidth={1.6}/></span>
        <span><strong>alexandria</strong><small>uma biblioteca loquinha</small></span>
      </Link>
      <nav className={styles.nav} aria-label="Navegação principal">
        <NavLink to="/" end className={({isActive})=>isActive?styles.active:undefined}>Acervo</NavLink>
        <a href="#sobre">O projeto</a>
      </nav>
      <span className={styles.eyebrow}><span className={styles.dot}></span> histórias que ficam</span>
      <Menu className={styles.mobileSymbol} size={20} aria-hidden="true" />
    </div>
  </header>;
}
