import { Select } from '@/components/ui/select'
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type SortField,
  type SortOrder,
  SORT_FIELDS,
  type TaskPriority,
  type TaskStatus,
} from '@/types/task'
import { statusLabel } from '@/features/tasks/utils/presentation'

export const TaskFilters = ({
  status,
  priority,
  dueAfter,
  dueBefore,
  sortBy,
  sortOrder,
  onFilterChange,
  onSortChange,
}: {
  status: TaskStatus | ''
  priority: TaskPriority | ''
  dueAfter: string
  dueBefore: string
  sortBy: SortField
  sortOrder: SortOrder
  onFilterChange: (payload: {
    status?: TaskStatus | ''
    priority?: TaskPriority | ''
    dueAfter?: string
    dueBefore?: string
  }) => void
  onSortChange: (payload: { sortBy?: SortField; sortOrder?: SortOrder }) => void
}) => (
  <section className="grid gap-3 rounded-xl border bg-[rgb(var(--surface))] p-3 md:grid-cols-3 xl:grid-cols-6">
    <Select value={status} onChange={(event) => onFilterChange({ status: event.target.value as TaskStatus | '' })}>
      <option value="">All statuses</option>
      {TASK_STATUSES.map((item) => (
        <option value={item} key={item}>
          {statusLabel[item]}
        </option>
      ))}
    </Select>

    <Select
      value={priority}
      onChange={(event) => onFilterChange({ priority: event.target.value as TaskPriority | '' })}
    >
      <option value="">All priorities</option>
      {TASK_PRIORITIES.map((item) => (
        <option value={item} key={item}>
          {item}
        </option>
      ))}
    </Select>

    <input
      className="h-10 rounded-lg border px-3 text-sm"
      type="date"
      value={dueAfter}
      onChange={(event) => onFilterChange({ dueAfter: event.target.value })}
      aria-label="Due after"
    />

    <input
      className="h-10 rounded-lg border px-3 text-sm"
      type="date"
      value={dueBefore}
      onChange={(event) => onFilterChange({ dueBefore: event.target.value })}
      aria-label="Due before"
    />

    <Select value={sortBy} onChange={(event) => onSortChange({ sortBy: event.target.value as SortField })}>
      {SORT_FIELDS.map((field) => (
        <option value={field} key={field}>
          Sort: {field}
        </option>
      ))}
    </Select>

    <Select value={sortOrder} onChange={(event) => onSortChange({ sortOrder: event.target.value as SortOrder })}>
      <option value="desc">Order: Desc</option>
      <option value="asc">Order: Asc</option>
    </Select>
  </section>
)
