// Demo fixture data — applied only to the singleton `store` (server/utils/store.ts), never to
// createStore() itself, so every test's "starts empty" assumption stays true. Seven events with a
// deliberate mix of Base-support/Resources-committed states (for visually comparing the User and
// Leader views) and a spread of vote/volunteer totals across all three seeded accounts — see the
// Milestone 7 note below on why the mix looks the way it does.
//
// Not unit-tested: this only ever runs against the module-level `store` singleton, never against
// a test's own createStore() instance (see store.ts's comment on that split), so there's nothing
// here for Vitest to assert against.

import type { Store } from './store'
import { toDateKey } from '../../shared/utils/groupEventsByDate'

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
  store.castInterest('leader-1', cookout.id, 'vote') // 2 votes — one of the two top-voted ideas

  const firstAid = store.createEvent({
    name: 'First Aid & CPR Training',
    location: 'Wellness Center, Room 4',
    type: 'Training',
    description: 'Certified first aid and CPR refresher course, open to all personnel.',
    dateTime: '2026-09-05T09:00:00.000Z',
    submittedBy: 'user-2'
  })
  store.castInterest('user-1', firstAid.id, 'volunteer') // 1 vote (volunteering counts as one)

  const fundraiser = store.createEvent({
    name: 'Charity 5K Fun Run',
    location: 'Main Gate Track',
    type: 'Fundraiser',
    description: 'A timed 5K to raise funds for the base family support fund. All paces welcome.',
    dateTime: '2026-09-12T07:30:00.000Z',
    submittedBy: 'user-1'
  })
  store.setBaseSupport(fundraiser.id, true)
  store.castInterest('user-2', fundraiser.id, 'vote') // 1 vote

  const cleanup = store.createEvent({
    name: 'Volunteer Cleanup Day',
    location: 'Base Perimeter Trail',
    type: 'Community Service',
    description: 'Help clear brush and litter along the perimeter trail. Gloves and tools provided.',
    dateTime: '2026-09-15T08:00:00.000Z',
    submittedBy: 'user-2'
  })
  store.setResourcesCommitted(cleanup.id, true) // 0 votes — still awaiting any interest

  const basketball = store.createEvent({
    name: 'Intramural Basketball Tournament',
    location: 'Fitness Center Gym',
    type: 'Sports/Recreation',
    description: '3-on-3 bracket tournament — sign up as a team or as a free agent.',
    dateTime: '2026-09-20T17:00:00.000Z',
    submittedBy: 'user-1'
  })
  store.castInterest('leader-1', basketball.id, 'vote') // 1 vote

  // Milestone 7: added for vote-total variety without adding accounts — leader-1 (previously
  // never a voter/volunteer) now participates above and here, and this event ties Community
  // Cookout at 2 votes, giving the Top 2 Voted view (votes.vue) a real tie to break by insertion
  // order rather than every event being trivially distinct.
  const movieNight = store.createEvent({
    name: 'Movie Night Under the Stars',
    location: 'Parade Field',
    type: 'Social',
    description: 'Outdoor screening, blankets and folding chairs welcome. Concessions provided.',
    dateTime: '2026-09-26T20:00:00.000Z',
    submittedBy: 'user-2'
  })
  store.castInterest('user-1', movieNight.id, 'volunteer')
  store.castInterest('leader-1', movieNight.id, 'vote') // 2 votes — ties Community Cookout

  // Milestone 7: dated on the real current date (not a fixed string, unlike every other seeded
  // event above) specifically so calendar.vue's "today" panel always has something to show in a
  // fresh `npm run dev`, regardless of when that happens to be. Built from local date components
  // (toDateKey) rather than Date.toISOString() directly, so its date portion can never drift a
  // day off from what "today" means to the rest of the app — see groupEventsByDate.ts's note on
  // why event dateTime strings are never timezone-converted.
  const townHall = store.createEvent({
    name: 'Coffee & Concerns with Leadership',
    location: 'Base Community Center',
    type: 'Community Service',
    description: 'Open office hours with Base leadership — bring questions, ideas, or concerns.',
    dateTime: `${toDateKey(new Date())}T12:00:00.000Z`,
    submittedBy: 'leader-1'
  })
  store.castInterest('user-1', townHall.id, 'vote') // 1 vote
}
