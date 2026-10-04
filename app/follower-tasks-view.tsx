import type { ButtonHTMLAttributes } from 'react'
import { FollowerNumber } from './hud'
import art from './original-follower-tasks.json'
import { followerTaskCounts, type FollowerTask, type TaskPerson } from './hud-tasks.ts'

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
  people,
  center,
  nearby,
  control,
}: {
  people: TaskPerson[]
  center: { x: number; y: number }
  nearby: boolean
  control: (model: number, category: FollowerTask) => ButtonHTMLAttributes<HTMLButtonElement>
}) {
  const counts = followerTaskCounts(people, center, nearby)
  return (
    <section className="follower-tasks" aria-label="Follower tasks">
      {tasks.map(({ category, label }, row) =>
        columns.map(({ model, label: kind }, column) => {
          const enabled = model === 0 || counts.totals[model] > 0,
            sprite = model === 0 ? 637 + category * 2 : 1083 + category,
            action = category === 1 ? 'deselect' : 'select'
          return (
            <button
              key={`${model}-${category}`}
              aria-label={`${label} ${kind}`}
              disabled={!enabled}
              style={{ left: column * 16, top: 6 + row * 41 }}
              title={
                enabled
                  ? `${label} ${kind}: Click to ${action}. ${category === 1 ? '' : 'Ctrl: select five. '}Shift: ${action} all. Right-click: focus next.`
                  : undefined
              }
              {...control(model, category)}
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
              <FollowerNumber
                count={counts.tasks[model][category]}
                alternate={nearby && model !== 0}
                y={24}
              />
            </button>
          )
        })
      )}
    </section>
  )
}
