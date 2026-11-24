import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function BarberPicker() {
  return (
    <ScreenPlaceholder
      number="Screen 5"
      route="/barber"
      title="Which barber are you?"
      who="A barber picks their own screen once; the phone remembers it."
      access="Staff PIN"
      device="Phone"
      step={5}
      plan={['One big card per barber on duty: signature avatar and name', 'Tapping a card opens /barber/<name>']}
    />
  )
}
