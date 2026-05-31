import { ReactNode } from 'react';

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}
