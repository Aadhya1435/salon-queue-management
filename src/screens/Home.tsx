import DbCheck from '../components/DbCheck'
import ScreenPlaceholder from '../components/ScreenPlaceholder'

export default function Home() {
  return (
    <ScreenPlaceholder
      number="Screen 1"
      route="/"
      title="Home"
      who="A customer checks how busy the salon is and joins the queue."
      access="Public"
      device="Phone"
      step={2}
      plan={[
        'Plum hero: identity row (logo, Kesh Studio, open status) with a small corner blob cluster',
        '"6 waiting · about 50 min if you join now", with a live dot',
        'White "Join the queue ›" pill, or a "My spot" pill if this phone already joined',
        'Barbers today: signature avatar, name and Free / Busy / On break chip',
        '"Already in the queue? Find my spot" and a small Staff link',
      ]}
    >
      <DbCheck />
    </ScreenPlaceholder>
  )
}
