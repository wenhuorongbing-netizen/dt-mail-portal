import { useEffect, useState } from 'react';
import { Button } from '../../core/ui/Button';
import { Card } from '../../core/ui/Card';
import { Input } from '../../core/ui/Input';
import { Table } from '../../core/ui/Table';
import { Tag } from '../../core/ui/Tag';

interface ExampleItem {
  id: number;
  name: string;
  created_at: string;
}

export default function ExamplePage() {
  const [items, setItems] = useState<ExampleItem[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadItems() {
    const response = await fetch('/api/example/items');
    if (response.ok) setItems(await response.json());
  }

  async function createItem() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch('/api/example/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName('');
    setLoading(false);
    await loadItems();
  }

  async function deleteItem(id: number) {
    await fetch(`/api/example/items/${id}`, { method: 'DELETE' });
    await loadItems();
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className="module-grid">
      <Card className="command-card">
        <div>
          <p className="eyebrow">Addon contract demo</p>
          <h3>Create an example record</h3>
          <p className="muted">This module uses the shared shell, layout and UI components.</p>
        </div>
        <div className="inline-form">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Record name" />
          <Button disabled={loading} onClick={createItem}>{loading ? 'Creating…' : 'Create'}</Button>
        </div>
      </Card>

      <Card>
        <div className="section-header">
          <h3>Records</h3>
          <Tag tone="success">API-connected</Tag>
        </div>
        <Table
          data={items}
          columns={[
            { key: 'name', header: 'Name', render: (item) => item.name },
            { key: 'created', header: 'Created', render: (item) => new Date(item.created_at).toLocaleString() },
            { key: 'actions', header: 'Actions', render: (item) => <Button className="button-secondary" onClick={() => deleteItem(item.id)}>Delete</Button> },
          ]}
        />
      </Card>
    </div>
  );
}
