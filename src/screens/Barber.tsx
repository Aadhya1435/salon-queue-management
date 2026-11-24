import { useParams } from 'react-router'
import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function Barber() {
  const { name = '' } = useParams()
  const display = name.charAt(0).toUpperCase() + name.slice(1)
  return (
    <ScreenPlaceholder
      number="Screen 5"
      route="/barber/:name"
      title={`Barber View · ${display}`}
      who="A barber sees who's in the chair and who's next, with busy hands."
      access="Staff PIN"
      device="Phone"
      step={5}
      plan={[
        'Top bar: signature avatar, name, status chip and a Break / Available switch',
        'Hero card by state: Call next → Start → Done (giant pill, 72 px or more)',
        'Big elapsed timer with a progress bar while In chair',
        '"Next for you" card and "3 waiting for you"',
        'On break: the screen dims, with an "I\'m back" button',
      ]}
    />
  )
}
