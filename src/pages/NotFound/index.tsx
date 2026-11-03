import { ArrowLeft, BookOpenText } from 'lucide-react';
import { Link } from 'react-router';
import styles from './styles.module.scss';

export default function NotFound() {
  return <section className={`container ${styles.page}`}>
    <BookOpenText size={40} strokeWidth={1.2} />
    <span className="eyebrow">PÁGINA NÃO ENCONTRADA</span>
    <h1>Este capítulo ainda não existe.</h1>
    <p>Talvez você tenha seguido um marcador antigo. O acervo continua aqui.</p>
    <Link to="/"><ArrowLeft size={15}/> Voltar à biblioteca</Link>
  </section>;
}
