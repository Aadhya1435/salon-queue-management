import { useParams } from 'react-router'
import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function Status() {
  const { id } = useParams()
  return (
    <ScreenPlaceholder
      number="Screen 3"
      route="/status/:id"
      title="My Status"
      who={`A customer watches their place from anywhere and gets called. Spot id: ${id}`}
      access="Private link"
      device="Phone"
      step={3}
      plan={[
        'Journey tracker: Joined · Coming · Your turn · In chair · Done',
        'Token card S-14 with the barber avatar, and a wait card with place + countdown ring',
        '"Your turn in about 15 min · around 2:25 PM"',
        '"Start coming" at 2nd, "You\'re next!" at 1st',
        'Full-screen "It\'s your turn! Go to Amit", then In chair, Done and a star rating',
        'Cancel my spot (quiet link with a confirmation)',
      ]}
    />
  )
}
