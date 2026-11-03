import type { PropsWithChildren } from 'react';

export type ReaderPanelProps = PropsWithChildren<{
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  editorial?: boolean;
}>;
