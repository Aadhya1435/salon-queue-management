import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function Reception() {
  return (
    <ScreenPlaceholder
      number="Screen 4"
      route="/reception"
      title="Reception Dashboard"
      who="The receptionist runs the whole queue from one tablet screen."
      access="Staff PIN"
      device="Tablet · 1024×768"
      step={4}
      plan={[
        'Top bar: live dot, clock, online-queue pill, + Add walk-in, Lock',
        'Barber cards: current customer, progress bar, Call next / Start / Done, No-show countdown, Break switch',
        'Waiting list in queue order; waits over 60 min get the warning tint',
        'Add walk-in side sheet, then a big token with a status QR code',
        'No-shows today with Re-add (new token at the end)',
      ]}
    />
  )
}
