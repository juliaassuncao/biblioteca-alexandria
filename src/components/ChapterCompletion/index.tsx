import { Check, BookOpen } from 'lucide-react';
import { useChapterCompletion } from '../../hooks/useChapterCompletion';
import type { ChapterCompletionProps } from './props';
import styles from './styles.module.scss';

export default function ChapterCompletion({ workId, chapterId }: ChapterCompletionProps) {
  const { isRead, toggle, persisted } = useChapterCompletion(workId);
  const read = isRead(chapterId);
  return <div className={styles.completion}>
    <button type="button" aria-pressed={read} onClick={() => toggle(chapterId)}>
      {read ? <Check size={18} aria-hidden="true" /> : <BookOpen size={18} aria-hidden="true" />}
      {read ? 'Capítulo marcado como lido' : 'Marcar capítulo como lido'}
    </button>
    <p>{!persisted ? 'Armazenamento indisponível. Marcação mantida nesta sessão.' : read ? 'Clique novamente para desfazer a marcação.' : 'A marcação é manual e fica neste navegador.'}</p>
  </div>;
}
