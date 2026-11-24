import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function Admin() {
  return (
    <ScreenPlaceholder
      number="Screen 7"
      route="/admin"
      title="Owner Settings & Stats"
      who="The owner sets up the day and sees how it's going."
      access="Owner PIN"
      device="Phone / laptop"
      step={6}
      plan={[
        'Queue switch: Open / Closed for online joining',
        'Today: served, average wait, no-shows, cancelled, est. takings, average rating',
        'Charts: customers per hour, served per barber, average wait by hour',
        'Settings: salon name and hours, barbers on duty, services (on/off, edit, reorder)',
        'QR poster link, change PINs, and demo tools (fill / reset today)',
      ]}
    />
  )
}
