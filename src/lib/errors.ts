// The database functions fail with short codes (supabase/migrations). This turns
// them into the friendly text from docs/03-flows-rules.md.

const MESSAGES: Record<string, string> = {
  invalid_pin: 'Wrong PIN.',
  invalid_phone: 'Enter a 10-digit mobile number.',
  invalid_name: 'Enter your name (2–30 letters).',
  services_1_to_3: 'Pick 1 to 3 services.',
  duplicate_service: 'Each service can be picked once.',
  service_unavailable: "One of those services isn't available right now.",
  barber_unavailable: "That stylist isn't working today. Pick another or Any stylist.",
  online_closed: 'Online queue is closed right now. Walk-ins are welcome at the salon.',
  not_open_yet: "We're not open yet.",
  no_barbers: 'No stylists available right now.',
  salon_closed: 'The salon has closed for today.',
  barber_not_found: 'That stylist no longer exists.',
  barber_off_duty: "That stylist isn't on duty today.",
  barber_on_break: 'That stylist is on break.',
  barber_busy: 'Finish the current customer first.',
  bad_transition: 'That spot has already moved on. The screen will refresh.',
  no_show_too_early: 'No-show is allowed 10 minutes after calling.',
  cannot_cancel: 'This spot can no longer be cancelled.',
  cannot_rate: 'This visit has already been rated.',
  invalid_rating: 'Pick 1 to 5 stars.',
  cannot_readd: 'This customer can’t be re-added.',
  finish_current_first: 'Finish with the current customer first.',
  barber_has_customers: 'Customers are waiting for this stylist.',
  invalid_settings: 'Check the salon name and hours: opening must be before closing.',
  invalid_service: 'Check the service name, minutes (5–240) and price.',
  service_not_found: 'That service no longer exists.',
  invalid_barber: 'Check the stylist name, colour and shape.',
  barber_name_taken: 'A stylist with that name already exists.',
  invalid_new_pin: 'A PIN is 4 digits.',
  queue_not_empty: 'Clear today’s queue before filling it with demo customers.',
}

/** Extracts the short code from a Supabase/Postgres error, if there is one. */
export function errorCode(error: unknown): string | null {
  const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: unknown }).message) : ''
  return message in MESSAGES ? message : null
}

/** Friendly text for any error thrown while talking to the database. */
export function friendlyError(error: unknown): string {
  const code = errorCode(error)
  if (code) return MESSAGES[code]
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'You’re offline. Reconnecting…'
  return 'Something went wrong. Please try again.'
}
