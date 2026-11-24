import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function Join() {
  return (
    <ScreenPlaceholder
      number="Screen 2"
      route="/join"
      title="Join the queue"
      who="A customer joins in under a minute."
      access="Public"
      device="Phone"
      step={2}
      plan={[
        'Name and phone (+91, 10 digits, checked as you go)',
        'Service tiles with a count badge, up to 3; a 4th one shakes',
        'Barber cards: Any, Ravi, Amit, Imran with their wait, and a sliding selection ring',
        '"Your turn in about 50 min · around 3:00 PM" strip',
        'Confirm · ₹230 › pill, then the "You\'re in!" celebration',
      ]}
    />
  )
}
