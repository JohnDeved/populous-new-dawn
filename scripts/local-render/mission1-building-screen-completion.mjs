// One Startup Load of genuine saved1300; accepted failed02 partials stay pinned.
import continuation from './mission1-building-screen-continuation.mjs'

export default async function mission1BuildingScreenCompletion(context) {
  return continuation(context, { completionOnly: true })
}
