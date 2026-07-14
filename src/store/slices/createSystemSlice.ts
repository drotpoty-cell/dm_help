'use client'

import type { StateCreator } from 'zustand'
import type { Edge } from 'reactflow'
import type { WorkspaceState, PlotNode, StoryPart, WeatherState } from '@/types/workspace'
import { getEmptySystemState } from '../storeConstants'

export interface SystemSlice {
  weather: WeatherState
  currentDay: number
  currentHour: number
  story: StoryPart[]
  plotNodes: Record<string, PlotNode>
  partyLocationId: string | null

  setWeather: (weather: Partial<WeatherState>) => void
  advanceTime: (hours: number) => void
  setStory: (story: StoryPart[]) => void
  addPlotNode: (node: PlotNode) => void
  updatePlotNode: (id: string, data: Partial<PlotNode>) => void
  deletePlotNode: (id: string) => void
  generateForecast: (daysCount: number) => void
  setPartyLocation: (newLocationId: string | null) => void
}

export const createSystemSlice: StateCreator<WorkspaceState, [], [], SystemSlice> = (set, get) => ({
  ...getEmptySystemState(),

  setWeather: (newWeather) => set((state) => ({ weather: { ...state.weather, ...newWeather } })),

  addPlotNode: (node) =>
    set((state) => ({
      plotNodes: { ...state.plotNodes, [node.id]: node },
    })),

  updatePlotNode: (id, data) =>
    set((state) => ({
      plotNodes: { ...state.plotNodes, [id]: { ...state.plotNodes[id], ...data } },
    })),

  deletePlotNode: (id) =>
    set((state) => {
      const next = { ...state.plotNodes }
      delete next[id]
      return { plotNodes: next }
    }),

  generateForecast: (daysCount) =>
    set((state) => {
      const newForecast = { ...state.weather.forecast }
      const startDay = state.currentDay

      const conditionsMap: Record<string, string[]> = {
        temperate: ['Ясно', 'Ясно', 'Облачно', 'Облачно', 'Дождь', 'Гроза', 'Туман'],
        winter: ['Ясно', 'Облачно', 'Снег', 'Снег', 'Вьюга', 'Туман'],
        desert: ['Ясно', 'Ясно', 'Ясно', 'Песчаная буря', 'Облачно'],
        tropical: ['Ясно', 'Дождь', 'Ливень', 'Гроза', 'Туман'],
      }

      const baseTemp =
        { temperate: 15, winter: -15, desert: 35, tropical: 28 }[state.weather.climate as string] || 15

      for (let i = 0; i < daysCount; i++) {
        const dayNum = startDay + i
        const options = conditionsMap[state.weather.climate] || conditionsMap.temperate
        newForecast[dayNum] = {
          condition: options[Math.floor(Math.random() * options.length)],
          temp: baseTemp + (Math.floor(Math.random() * 10) - 5),
        }
      }
      return { weather: { ...state.weather, forecast: newForecast } }
    }),

  setPartyLocation: (newLocationId) => {
    const state = get()
    const currentLocationId = state.partyLocationId

    if (currentLocationId && newLocationId && currentLocationId !== newLocationId) {
      const edge = state.edges.find(
        (e: Edge) =>
          (e.source === currentLocationId && e.target === newLocationId) ||
          (e.target === currentLocationId && e.source === newLocationId)
      )

      if (edge && edge.data) {
        let travelDays = edge.data.days || 0
        let travelHours = edge.data.hours || 0

        if (state.weather.mode !== 'disabled') {
          const badWeather = ['Дождь', 'Снег', 'Гроза', 'Туман', 'Песчаная буря', 'Вьюга']
          if (badWeather.includes(state.weather.condition)) {
            const multiplier = ['Гроза', 'Вьюга', 'Туман', 'Песчаная буря'].includes(
              state.weather.condition
            )
              ? 2
              : 1.5
            travelDays = Math.ceil(travelDays * multiplier)
            travelHours = Math.ceil(travelHours * multiplier)
          }
        }

        const totalHoursToAdd = travelDays * 24 + travelHours

        if (totalHoursToAdd > 0) {
          state.advanceTime(totalHoursToAdd)
        }
      }
    }

    set({ partyLocationId: newLocationId })
  },

  setStory: (story) => set({ story }),

  advanceTime: (hours) =>
    set((state) => {
      const safeHours = Number(hours)
      let newHour = Number(state.currentHour) + safeHours
      let newDay = Number(state.currentDay)

      if (newHour >= 24) {
        newDay += Math.floor(newHour / 24)
        newHour = newHour % 24
      } else if (newHour < 0) {
        const daysToSubtract = Math.ceil(Math.abs(newHour) / 24)
        newDay -= daysToSubtract
        newHour = (newHour % 24 + 24) % 24
      }
      if (newDay < 1) {
        newDay = 1
        newHour = 0
      }

      const nextState: Partial<WorkspaceState> = {
        currentHour: newHour,
        currentDay: newDay,
      }

      try {
        const processEntities = (entities: any) => {
          if (!entities) return entities
          const updated = { ...entities }
          Object.keys(updated).forEach((id) => {
            const entity = updated[id]
            if (!entity || !Array.isArray(entity.schedule) || entity.schedule.length === 0) {
              if (entity && entity.defaultLocationId !== undefined) {
                entity.locationId = entity.defaultLocationId || ''
                entity.currentActivity = ''
              }
              return
            }

            const activeSchedule = entity.schedule.find((entry: any) => {
              if (!entry) return false
              const s = Number(entry.startHour)
              const e = Number(entry.endHour)
              if (s <= e) return newHour >= s && newHour < e
              return newHour >= s || newHour < e
            })

            if (activeSchedule) {
              entity.locationId = activeSchedule.locationId || ''
              entity.currentActivity = activeSchedule.activity || ''
            } else {
              entity.locationId = entity.defaultLocationId || ''
              entity.currentActivity = ''
            }
          })
          return updated
        }

        nextState.characters = processEntities(state.characters)
        nextState.npcs = processEntities(state.npcs)
        nextState.extras = processEntities(state.extras)
      } catch (error) {
        console.error('Ошибка при пересчете расписаний:', error)
      }

      return nextState
    }),
})
