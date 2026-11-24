import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function Poster() {
  return (
    <ScreenPlaceholder
      number="Screen 8"
      route="/poster"
      title="QR Poster"
      who="An A4 poster for the salon door or counter."
      access="Owner PIN"
      device="Print · A4"
      step={6}
      plan={[
        'Salon name and "Skip the wait — join the queue from your phone"',
        'Large QR code that opens /join',
        '3 steps: Scan → Pick services → We\'ll call you',
        'The URL as text, and a Print button that is hidden when printing',
      ]}
    />
  )
}
