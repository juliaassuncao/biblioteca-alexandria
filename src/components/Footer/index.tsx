import { Link } from 'react-router';
import { BookOpenText, Heart } from 'lucide-react';
import styles from './styles.module.scss';

export default function Footer() {
  return <footer className={styles.footer} id="sobre">
    <div className={`container ${styles.inner}`}>
      <div><BookOpenText size={20} strokeWidth={1.5}/><strong>Biblioteca de Alexandria</strong>
        <p>Uma casa para histórias que merecem continuar sendo lidas.</p>
      </div>
      <div className={styles.right}>
        <p>Projeto de fãs independente, não oficial e sem fins lucrativos.<br/>Personagens e universos pertencem aos respectivos titulares;<br/>textos e contribuições criativas, às suas autoras.</p><Link className={styles.about} to="/o-projeto">Sobre o projeto e os créditos</Link>
        <small>Feita para as Loquinhas <Heart size={12} fill="currentColor" /></small>
      </div>
    </div>
  </footer>;
}
