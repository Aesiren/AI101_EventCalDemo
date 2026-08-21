// AI content guideline checker (US-1.5–US-1.9). This is the deterministic backstop the AI agent
// (agent.ts, next) leans on — it contains NO AI, no network calls, nothing an LLM's own judgment
// could be talked out of. That's deliberate: it's what makes US-1.10 (prompt-injection
// resistance) real rather than a promise. The agent can be as clever or as fooled as it wants by
// a user's phrasing; the actual policy verdict always comes from this plain function instead.
//
// Detection method: keyword/phrase matching, case-insensitive, on whole words only (so "bar"
// doesn't false-positive inside "barbecue"). This is intentionally simple — it can't understand
// nuance (a documentary *about* alcoholism would trip the alcohol rule same as an actual drinking
// event) — but it's free, instant, fully deterministic, and trivially testable. Right tradeoff
// for a demo; a real product would likely combine this with LLM-based classification, using this
// kind of rule as a hard backstop underneath it rather than the whole story.

import type { GuidelineResult } from '../../shared/types'

export interface ContentDraft {
  name?: string
  description?: string
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some(phrase => new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i').test(text))
}

const ALCOHOL_TERMS = [
  'alcohol', 'beer', 'wine', 'liquor', 'cocktail',
  'open bar', 'full bar', 'bar crawl', 'beer pong', 'brewery', 'winery'
]
const UNDER_21_TERMS = [
  'under 21', 'under-21', 'youth', 'teen', 'teens', 'teenager', 'high school', 'middle school', 'minors'
]
const DRUG_TERMS = [
  'marijuana', 'weed', 'cannabis', 'cocaine', 'heroin', 'meth', 'narcotics', 'lsd', 'ecstasy', 'mdma', 'drugs'
]
const BRAND_PHRASES = [
  'sponsored by', 'brought to you by', 'presented by', 'official partner', 'exclusively from', 'in partnership with'
]
const GAMBLING_TERMS = ['gambling', 'casino', 'poker', 'blackjack', 'slot machine', 'betting', 'wager', 'raffle']
const FREE_TICKET_PHRASES = ['free ticket', 'first ticket free', 'ticket is free', 'tickets are free']
const NO_REAL_MONEY_PHRASES = ['no real money', 'play money', 'no real cash', 'fake money', 'no cash involved', 'not real money']
const EXPLICIT_TERMS = [
  'gore', 'graphic violence', 'explicit content', 'extreme violence', 'sexual content', 'nudity', 'profanity'
]

export function evaluate(draft: ContentDraft): GuidelineResult {
  const text = `${draft.name ?? ''} ${draft.description ?? ''}`

  const hasAlcohol = containsAny(text, ALCOHOL_TERMS)
  const hasUnder21 = containsAny(text, UNDER_21_TERMS)
  const hasDrugs = containsAny(text, DRUG_TERMS)

  // Irreparable rules first — these preempt any correction opportunity, per docs/05-spec.md.
  if (hasUnder21 && hasAlcohol) {
    return {
      status: 'rejected',
      guideline: 'No alcohol at events tailored for under-21 members',
      message:
        'This event mentions alcohol and appears tailored for members under 21. This cannot be ' +
        'corrected within this submission — please resubmit without any under-21 framing and ' +
        'without alcohol.'
    }
  }
  if (hasDrugs) {
    return {
      status: 'rejected',
      guideline: 'No drug use of any kind',
      message:
        'This event mentions drug use, which is not allowed under any circumstances. This ' +
        'cannot be corrected within this submission.'
    }
  }

  // Correctable rules — order doesn't matter much here since each returns immediately, but this
  // roughly follows the order they're listed in docs/05-spec.md.
  if (hasAlcohol) {
    return {
      status: 'correctable',
      guideline: 'No alcohol-specific events',
      message: 'This event appears to be centered on alcohol. Please revise so alcohol is not the focus.'
    }
  }

  if (containsAny(text, BRAND_PHRASES)) {
    return {
      status: 'correctable',
      guideline: 'No promoting a specific company/brand as Base-endorsed',
      message: 'This event appears to promote a specific company or brand. Please remove anything that could read as a Base endorsement.'
    }
  }

  if (containsAny(text, GAMBLING_TERMS)) {
    const raffleException = containsAny(text, ['raffle']) && containsAny(text, FREE_TICKET_PHRASES)
    const cardGameException =
      containsAny(text, ['poker', 'blackjack']) && containsAny(text, NO_REAL_MONEY_PHRASES)

    if (!raffleException && !cardGameException) {
      return {
        status: 'correctable',
        guideline: 'No gambling, except raffles with a free ticket option or poker/blackjack with no real money',
        message:
          'This event appears to involve gambling. Raffles need at least one free-ticket option; ' +
          'poker/blackjack need to explicitly state no real money is used.'
      }
    }
  }

  if (containsAny(text, EXPLICIT_TERMS)) {
    return {
      status: 'correctable',
      guideline: 'No explicit content',
      message: 'This description contains explicit content (excessive violence, gore, or similar). Please revise to remove it.'
    }
  }

  return { status: 'clear' }
}
