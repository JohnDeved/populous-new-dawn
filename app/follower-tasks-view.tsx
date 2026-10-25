import type { ButtonHTMLAttributes } from 'react'
import { transportCounts, type HudTransport, type TransportKind } from './hud-transports.ts'
import { FollowerNumber } from './hud'
import art from './original-follower-tasks.json'
import type { followerTaskCounts, FollowerTask, TaskPerson } from './hud-tasks.ts'

const columns = [
  { model: 0, label: 'Followers' },
  { model: 2, label: 'Braves' },
  { model: 3, label: 'Warriors' },
  { model: 6, label: 'Firewarriors' },
  { model: 4, label: 'Preachers' },
  { model: 5, label: 'Spies' },
] as const
const tasks = [
  { category: 1, label: 'Currently selected' },
  { category: 2, label: 'Idle' },
  { category: 3, label: 'Housed' },
  { category: 4, label: 'Busy' },
] as const

function TaskIcon({ id }: { id: number }) {
  const r = (art.rects as Record<string, { x: number; y: number; w: number; h: number }>)[id]
  return (
    <i
      aria-hidden="true"
      className="follower-task-icon"
      style={{
        width: r.w,
        height: r.h,
        left: 7 - Math.trunc(r.w / 2),
        top: 17 - Math.trunc((r.h + 8) / 2),
        backgroundPosition: `-${r.x}px -${r.y}px`,
      }}
    />
  )
}

export function FollowerTasks({
  counts,
  center,
  nearby,
  control,
  vehicles,
  transportPeople,
  transportControl,
}: {
  vehicles: HudTransport[]
  transportPeople: (TaskPerson & { commandStatus: number })[]
  transportControl: (model: number, kind: TransportKind) => ButtonHTMLAttributes<HTMLButtonElement>
  counts: ReturnType<typeof followerTaskCounts>
  center: { x: number; y: number }
  nearby: boolean
  control: (model: number, category: FollowerTask) => ButtonHTMLAttributes<HTMLButtonElement>
}) {
  const transports = transportCounts(vehicles, transportPeople, center, nearby)
  return (
    <section className="follower-tasks" aria-label="Follower tasks">
      {[
        ...tasks.map(({ category, label }, row) => ({
          key: `task-${category}`,
          label,
          y: 6 + row * 41,
          counts: counts.tasks.map(values => values[category]),
          totalSprite: 637 + category * 2,
          classSprite: 1083 + category,
          action: category === 1 ? 'deselect' : 'select',
          five: category !== 1,
          control: (model: number) => control(model, category),
        })),
        ...([1, 3] as const)
          .filter(kind => transports[kind].present)
          .map(kind => ({
            key: `transport-${kind}`,
            label: kind === 1 ? 'Boats occupied by' : 'Balloons occupied by',
            y: kind === 1 ? 190 : 231,
            counts: transports[kind].counts,
            totalSprite: kind === 1 ? 653 : 647,
            classSprite: kind === 1 ? 655 : 1088,
            action: 'select passengers',
            five: true,
            control: (model: number) => transportControl(model, kind),
          })),
      ].map(row =>
        columns.map(({ model, label: kind }, column) => {
          const enabled = model === 0 || counts.totals[model] > 0,
            sprite = model === 0 ? row.totalSprite : row.classSprite
          return (
            <button
              key={`${row.key}-${model}`}
              aria-label={`${row.label} ${kind}`}
              disabled={!enabled}
              style={{ left: column * 16, top: row.y }}
              title={
                enabled
                  ? `${row.label} ${kind}: Click to ${row.action}. ${row.five ? 'Ctrl: five. ' : ''}Shift: all. Right-click: focus next.`
                  : undefined
              }
              {...row.control(model)}
            >
              <span className="follower-task-frame" aria-hidden="true" />
              <span className="follower-task-normal">
                <TaskIcon id={sprite} />
              </span>
              {model === 0 && (
                <span className="follower-task-pressed">
                  <TaskIcon id={sprite + 1} />
                </span>
              )}
              <FollowerNumber count={row.counts[model]} alternate={nearby} y={24} />
            </button>
          )
        })
      )}
    </section>
  )
}
