'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from 'reactflow'

export type RouteEdgeData = {
  days?: number
  hours?: number
}

function formatTravelTime(days = 0, hours = 0): string | null {
  if (days <= 0 && hours <= 0) return null
  const parts: string[] = []
  if (days > 0) parts.push(`${days} дн.`)
  if (hours > 0) parts.push(`${hours} ч.`)
  return parts.join(' ')
}

function RouteEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<RouteEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const label = formatTravelTime(data?.days, data?.hours)

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#71717a',
          strokeWidth: 2,
          strokeDasharray: '6 4',
          ...style,
        }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan z-50"
          >
            <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] font-medium font-mono whitespace-nowrap shadow-lg">
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(RouteEdge)
