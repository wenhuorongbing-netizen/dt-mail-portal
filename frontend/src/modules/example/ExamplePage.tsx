import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageLayout } from '../../core/layout/PageLayout'
import { ListLayout } from '../../core/layout/layouts/ListLayout'
import { Button } from '../../core/ui/Button'
import { Input } from '../../core/ui/Input'
import { Tag } from '../../core/ui/Tag'

type ExampleItem = {
  id: number
  title: string
  status: string
}

const seedItems: ExampleItem[] = [
  { id: 1, title: 'Module config loaded from backend/app/modules', status: 'ready' },
  { id: 2, title: 'Frontend page wired through module registry', status: 'draft' },
]

export function ExamplePage() {
  const [items, setItems] = useState<ExampleItem[]>(seedItems)
  const [title, setTitle] = useState('')

  useEffect(() => {
    async function loadItems() {
      const response = await fetch('/api/example/items')
      if (response.ok) {
        setItems((await response.json()) as ExampleItem[])
      }
    }

    void loadItems().catch(() => setItems(seedItems))
  }, [])

  function addItem() {
    const nextTitle = title.trim()
    if (!nextTitle) {
      return
    }

    setItems((current) => [{ id: Date.now(), title: nextTitle, status: 'draft' }, ...current])
    setTitle('')
  }

  function removeItem(itemId: number) {
    setItems((current) => current.filter((item) => item.id !== itemId))
  }

  return (
    <PageLayout
      actions={
        <div className="row-actions">
          <Input
            aria-label="New module item"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="New module item"
            value={title}
          />
          <Button icon={Plus} onClick={addItem}>
            Add
          </Button>
        </div>
      }
      subtitle="Reference module for future admin pages and backend routers."
      title="Module Example"
    >
      <ListLayout
        columns={['Item', 'Status', 'Actions']}
        rows={items.map((item) => [
          item.title,
          <Tag key={`${item.id}-status`} tone={item.status === 'ready' ? 'success' : 'neutral'}>
            {item.status}
          </Tag>,
          <Button
            icon={Trash2}
            key={`${item.id}-delete`}
            onClick={() => removeItem(item.id)}
            variant="ghost"
          >
            Delete
          </Button>,
        ])}
      />
    </PageLayout>
  )
}
