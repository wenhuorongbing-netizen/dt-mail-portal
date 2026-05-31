import { ReactNode } from 'react';
import { ModuleConfig } from '../modules/modulesRegistry';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

export function ListLayout({ module, children }: { module: ModuleConfig; children: ReactNode }) {
  return (
    <div className="module-frame list-frame">
      <div className="module-frame-header">
        <div>
          <p className="eyebrow">List module</p>
          <h2>{module.title}</h2>
          {module.description && <p className="muted">{module.description}</p>}
        </div>
        <Input placeholder="Filter this module…" />
      </div>
      {children}
    </div>
  );
}

export function CalendarLayout({ module, children }: { module: ModuleConfig; children: ReactNode }) {
  return (
    <div className="module-frame calendar-frame">
      <div className="module-frame-header">
        <div>
          <p className="eyebrow">Calendar module</p>
          <h2>{module.title}</h2>
        </div>
      </div>
      <Card>
        <div className="calendar-placeholder">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className="calendar-cell">{index + 1}</div>
          ))}
        </div>
      </Card>
      {children}
    </div>
  );
}

export function ChatLayout({ module, children }: { module: ModuleConfig; children: ReactNode }) {
  return (
    <div className="module-frame chat-frame">
      <div className="chat-shell">
        <Card className="conversation-list">Conversation list placeholder</Card>
        <Card className="message-pane">
          <h2>{module.title}</h2>
          {children}
        </Card>
      </div>
    </div>
  );
}

export function FormLayout({ module, children }: { module: ModuleConfig; children: ReactNode }) {
  return (
    <div className="module-frame form-frame">
      <div className="module-frame-header">
        <div>
          <p className="eyebrow">Settings module</p>
          <h2>{module.title}</h2>
        </div>
      </div>
      <Card>{children}</Card>
    </div>
  );
}
