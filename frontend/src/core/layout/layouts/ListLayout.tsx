import type { ReactNode } from 'react'
import { DataTable } from '../../ui/DataTable'

type ListLayoutProps = {
  columns: string[]
  rows: ReactNode[][]
}

export function ListLayout({ columns, rows }: ListLayoutProps) {
  return (
    <div className="panel">
      <DataTable columns={columns} rows={rows} />
    </div>
  )
}
