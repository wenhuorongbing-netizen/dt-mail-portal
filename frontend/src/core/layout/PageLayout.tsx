import { ReactNode } from 'react';

export function PageLayout({ children }: { children: ReactNode }) {
  return <div className="page-layout">{children}</div>;
}
