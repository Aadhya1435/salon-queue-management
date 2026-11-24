import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function Display() {
  return (
    <ScreenPlaceholder
      tone="tv"
      number="Screen 6"
      route="/display"
      title="Waiting-Area TV"
      who="Customers in the salon see who's being served and who's next, from up to 5 m away."
      access="Public"
      device="TV · 1920×1080"
      step={5}
      plan={[
        '"Tap to start display" (unlocks the chime, keeps the screen awake)',
        'One row per barber: signature avatar, name, NOW S-12 in large orchid text',
        'Up next: 5 tokens with first names and "~2:25 PM"',
        'On a call: the row floods with colour and glows 3 times, a "S-14 → Amit" banner drops in, and a chime plays',
        'Scan-to-join QR code; empty and closed states',
      ]}
    />
  )
}
