import { Link } from 'react-router';
import styles from './styles.module.scss';
export default function Project() {
 return <article className={`container ${styles.page}`}><Link to="/">Voltar ao acervo</Link><span className="eyebrow">SOBRE A ALEXANDRIA</span><h1>Um projeto de fãs, uma biblioteca de histórias.</h1>
 <p>A Biblioteca de Alexandria é uma iniciativa independente, não oficial e sem fins lucrativos, dedicada ao compartilhamento e à apreciação da produção criativa do fandom.</p>
 <p>Não existe vínculo comercial, patrocínio ou associação oficial com os criadores ou titulares de direitos das obras originais.</p>
 <p>Personagens, universos, ambientações e demais elementos preexistentes pertencem aos respectivos criadores e titulares de direitos. Quando aplicável, isso inclui os personagens e elementos da novela Três Graças.</p>
 <p>Os textos originais, adaptações e contribuições criativas das fanfics são de suas respectivas autoras. As histórias são disponibilizadas mediante autorização delas, sem que a Biblioteca reivindique propriedade sobre os elementos preexistentes utilizados.</p>
 <p>A autorização das autoras não equivale à autorização dos titulares dos universos originais. A ausência de finalidade lucrativa não impede solicitações de remoção nem representa garantia de imunidade jurídica.</p>
 </article>;
}
