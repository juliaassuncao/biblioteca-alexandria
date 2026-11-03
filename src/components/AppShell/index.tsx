import type { PropsWithChildren } from 'react';
import Header from '../Header';
import Footer from '../Footer';

export default function AppShell({ children }: PropsWithChildren) {
  return <><Header /><main id="main-content">{children}</main><Footer /></>;
}
