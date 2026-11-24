import { friendlyError } from '../../lib/errors'
import { handleStaffError } from '../../lib/staff'

/** Signs out on invalid_pin and returns the friendly text for any owner call error. */
export function ownerError(error: unknown): string {
  handleStaffError(error)
  return friendlyError(error)
}
