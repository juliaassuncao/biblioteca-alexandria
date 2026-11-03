import type { Fanfic } from "../../types/fanfic";

export interface ReaderSessionProps {
  work: Fanfic;
  number: string | undefined;
}
