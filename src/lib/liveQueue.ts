/**
 * Live data for the customer screens: settings, barbers on duty, active
 * services and today's active queue. One shared store: it starts when the
 * first screen subscribes, refetches whenever Supabase Realtime reports a change
 * (so every screen agrees within seconds), and stops shortly after the last
 * screen leaves.
 */
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { friendlyError } from './errors'
import { isSupabaseConfigured, supabase } from './supabase'
import { salonDay } from './time'
import type { Barber, QueueEntry, Service, Settings } from './types'

export type LiveQueue = {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  /** True while the realtime connection is up. */
  live: boolean
  settings: Settings | null
  /** On duty, in display order. */
  barbers: Barber[]
  /** Active, in display order. */
  services: Service[]
  /** Today's Waiting / Called / In-chair spots, in queue order. */
  entries: QueueEntry[]
  /** Goes up after every successful load. Staff screens refetch their own data when it changes. */
  version: number
}

let state: LiveQueue = { status: 'loading', error: null, live: false, settings: null, barbers: [], services: [], entries: [], version: 0 }
const listeners = new Set<() => void>()

function emit(patch: Partial<LiveQueue>) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

async function loadOnce() {
  if (!isSupabaseConfigured) {
    emit({ status: 'error', error: 'This app is missing its Supabase keys.' })
    return
  }
  try {
    const [settings, barbers, services, entries] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('barbers').select('*').eq('on_duty', true).order('sort'),
      supabase.from('services').select('*').eq('active', true).order('sort'),
      supabase
        .from('queue_entries')
        .select('*')
        .eq('day', salonDay())
        .in('status', ['waiting', 'called', 'in_chair'])
        .order('joined_at')
        .order('token'),
    ])
    const error = settings.error ?? barbers.error ?? services.error ?? entries.error
    if (error) throw error
    emit({
      status: 'ready',
      error: null,
      settings: settings.data as Settings,
      barbers: barbers.data as Barber[],
      services: services.data as Service[],
      entries: entries.data as QueueEntry[],
      version: state.version + 1,
    })
  } catch (error) {
    // Keep showing the last good data if we had some.
    emit({ status: state.settings ? 'ready' : 'error', error: friendlyError(error) })
  }
}

let inFlight: Promise<void> | null = null
let again = false

/** Reloads everything. Calls made while a load is running get one more load afterwards. */
export function refreshQueue(): Promise<void> {
  if (inFlight) {
    again = true
    return inFlight
  }
  inFlight = (async () => {
    try {
      do {
        again = false
        await loadOnce()
      } while (again)
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

let debounce: ReturnType<typeof setTimeout> | undefined
const scheduleRefresh = () => {
  clearTimeout(debounce)
  debounce = setTimeout(refreshQueue, 120)
}

let channel: RealtimeChannel | null = null
let stopTimer: ReturnType<typeof setTimeout> | undefined
let pollTimer: ReturnType<typeof setInterval> | undefined

const onVisible = () => {
  if (document.visibilityState === 'visible') scheduleRefresh()
}
const onOffline = () => emit({ live: false })

function start() {
  clearTimeout(stopTimer)
  if (channel) return
  refreshQueue()
  channel = supabase.channel('roselle-live')
  for (const table of ['queue_entries', 'barbers', 'services', 'settings']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh)
  }
  channel.subscribe((status) => {
    emit({ live: status === 'SUBSCRIBED' && navigator.onLine })
    if (status === 'SUBSCRIBED') scheduleRefresh() // catch anything that changed while connecting
  })
  window.addEventListener('online', scheduleRefresh)
  window.addEventListener('offline', onOffline)
  document.addEventListener('visibilitychange', onVisible)
  // Safety net if realtime is down: poll every 15 s.
  pollTimer = setInterval(() => {
    if (!state.live) refreshQueue()
  }, 15_000)
}

function stop() {
  stopTimer = setTimeout(() => {
    if (listeners.size > 0 || !channel) return
    supabase.removeChannel(channel)
    channel = null
    clearInterval(pollTimer)
    window.removeEventListener('online', scheduleRefresh)
    window.removeEventListener('offline', onOffline)
    document.removeEventListener('visibilitychange', onVisible)
    emit({ live: false })
  }, 1500)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) start()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stop()
  }
}

const getSnapshot = () => state

export function useLiveQueue(): LiveQueue {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
