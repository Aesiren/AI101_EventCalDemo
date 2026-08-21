// Demo fixture data — applied only to the singleton `store` (server/utils/store.ts), never to
// createStore() itself, so every test's "starts empty" assumption stays true. Five events with a
// deliberate mix of Base-support/Resources-committed states (for visually comparing the User and
// Leader views) and some vote/volunteer interests seeded ahead of the Milestone 4 UI that will
// display them.

import type { Store } from './store'

export function seedDemoData(store: Store): void {
  const cookout = store.createEvent({
    name: 'Community Cookout',
    location: 'Base Pavilion',
    type: 'Social',
    description: 'A casual cookout open to all base members — burgers, music, and lawn games.',
    dateTime: '2026-09-01T18:00:00.000Z',
    submittedBy: 'user-1'
  })
  store.setBaseSupport(cookout.id, true)
  store.setResourcesCommitted(cookout.id, true)
  store.castInterest('user-2', cookout.id, 'vote')

  const firstAid = store.createEvent({
    name: 'First Aid & CPR Training',
    location: 'Wellness Center, Room 4',
    type: 'Training',
    description: 'Certified first aid and CPR refresher course, open to all personnel.',
    dateTime: '2026-09-05T09:00:00.000Z',
    submittedBy: 'user-2'
  })
  store.castInterest('user-1', firstAid.id, 'volunteer')

  const fundraiser = store.createEvent({
    name: 'Charity 5K Fun Run',
    location: 'Main Gate Track',
    type: 'Fundraiser',
    description: 'A timed 5K to raise funds for the base family support fund. All paces welcome.',
    dateTime: '2026-09-12T07:30:00.000Z',
    submittedBy: 'user-1'
  })
  store.setBaseSupport(fundraiser.id, true)
  store.castInterest('user-2', fundraiser.id, 'vote')

  const cleanup = store.createEvent({
    name: 'Volunteer Cleanup Day',
    location: 'Base Perimeter Trail',
    type: 'Community Service',
    description: 'Help clear brush and litter along the perimeter trail. Gloves and tools provided.',
    dateTime: '2026-09-15T08:00:00.000Z',
    submittedBy: 'user-2'
  })
  store.setResourcesCommitted(cleanup.id, true)

  // No Base support, no resources, no interest yet — an event still awaiting any decision.
  store.createEvent({
    name: 'Intramural Basketball Tournament',
    location: 'Fitness Center Gym',
    type: 'Sports/Recreation',
    description: '3-on-3 bracket tournament — sign up as a team or as a free agent.',
    dateTime: '2026-09-20T17:00:00.000Z',
    submittedBy: 'user-1'
  })
}
