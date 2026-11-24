// Row shapes of the public tables in supabase/migrations/20261124120000_salon_queue.sql.

export type Settings = {
  id: 1
  salon_name: string
  open_time: string // "10:00:00"
  close_time: string // "21:00:00"
  online_open: boolean
  updated_at: string
}

export type BarberShape = 'star' | 'clover' | 'circle' | 'pill'

export type Barber = {
  id: string
  name: string
  slug: string
  color: string
  shape: BarberShape
  on_duty: boolean
  on_break: boolean
  sort: number
}

export type Service = {
  id: string
  name: string
  minutes: number
  price: number
  active: boolean
  sort: number
}

/** A service as copied onto a queue entry at join time. */
export type ServiceSnapshot = Pick<Service, 'id' | 'name' | 'minutes' | 'price'>

export type QueueStatus = 'waiting' | 'called' | 'in_chair' | 'done' | 'cancelled' | 'no_show'

export type QueueEntry = {
  id: string
  day: string
  token: number
  first_name: string
  barber_pref: string | null // null = "Any stylist"
  assigned_barber: string | null
  services: ServiceSnapshot[]
  total_minutes: number
  total_price: number
  status: QueueStatus
  source: 'online' | 'walk_in'
  joined_at: string
  called_at: string | null
  started_at: string | null
  finished_at: string | null
  cancelled_at: string | null
  cancelled_by: 'customer' | 'salon' | null
  rating: number | null
  readded_from: string | null
}

/** Rows from staff_queue(): adds the private name and phone. */
export type StaffQueueEntry = QueueEntry & { full_name: string | null; phone: string | null }

/** Returned by join_queue / add_walk_in / readd. */
export type JoinResult = { id: string; token: number; existing: boolean }

export type StaffRole = 'staff' | 'owner'
