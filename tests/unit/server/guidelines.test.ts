import { describe, expect, it } from 'vitest'
import { evaluate } from '../../../server/utils/guidelines'

describe('evaluate (AI content guidelines)', () => {
  // --- Correctable violations (TC-1.7-01..04) ---

  it('flags an alcohol-specific event as correctable (TC-1.7-01)', () => {
    const result = evaluate({
      name: 'Wine Tasting Evening',
      description: 'Join us for a wine tasting featuring local vineyards and a full bar.'
    })
    expect(result.status).toBe('correctable')
    if (result.status === 'correctable') {
      expect(result.guideline).toMatch(/alcohol/i)
    }
  })

  it('flags brand/company promotion as correctable (TC-1.7-02)', () => {
    const result = evaluate({
      name: 'Energy Drink Tent',
      description: 'Free samples, sponsored by Monster Energy at our tent this weekend.'
    })
    expect(result.status).toBe('correctable')
    if (result.status === 'correctable') {
      expect(result.guideline).toMatch(/brand|company|endors/i)
    }
  })

  it('flags gambling without a valid exception as correctable (TC-1.7-03)', () => {
    const result = evaluate({
      name: 'Casino Night',
      description: 'Real-money blackjack and poker tables all evening.'
    })
    expect(result.status).toBe('correctable')
    if (result.status === 'correctable') {
      expect(result.guideline).toMatch(/gambl/i)
    }
  })

  it('flags a raffle with no mention of a free ticket as correctable gambling (TC-1.7-03)', () => {
    const result = evaluate({
      name: 'Charity Raffle',
      description: 'Tickets are $5 each, prizes awarded at the end of the night.'
    })
    expect(result.status).toBe('correctable')
  })

  it('flags explicit content as correctable (TC-1.7-04)', () => {
    const result = evaluate({
      name: 'Haunted House',
      description: 'An evening of graphic violence and extreme gore-themed scares.'
    })
    expect(result.status).toBe('correctable')
    if (result.status === 'correctable') {
      expect(result.guideline).toMatch(/explicit/i)
    }
  })

  // --- Valid exceptions that must NOT be flagged (TC-1.7-06, TC-1.7-07) ---

  it('does not flag a raffle that explicitly offers a free ticket (TC-1.7-06)', () => {
    const result = evaluate({
      name: 'Charity Raffle',
      description: 'Your first ticket is free; additional tickets are $5 each.'
    })
    expect(result.status).toBe('clear')
  })

  it('does not flag poker/blackjack that explicitly uses no real money (TC-1.7-07)', () => {
    const result = evaluate({
      name: 'Casino Night',
      description: 'Poker and blackjack tables — play money only, no real cash involved.'
    })
    expect(result.status).toBe('clear')
  })

  // --- Irreparable violations, reject on any presence (TC-1.9-01, TC-1.9-02) ---

  it('rejects outright when alcohol appears in an under-21-tailored event, even briefly (TC-1.9-01)', () => {
    const result = evaluate({
      name: 'High School Youth Mixer',
      description: 'A fun teen night for our youth members, with a full bar available for chaperones.'
    })
    expect(result.status).toBe('rejected')
    if (result.status === 'rejected') {
      expect(result.guideline).toMatch(/alcohol/i)
    }
  })

  it('rejects outright on any mention of drug use, even incidental (TC-1.9-02)', () => {
    const result = evaluate({
      name: 'Chill Evening',
      description: 'Bring your own marijuana for a relaxed smoke session under the stars.'
    })
    expect(result.status).toBe('rejected')
    if (result.status === 'rejected') {
      expect(result.guideline).toMatch(/drug/i)
    }
  })

  it('irreparable violations take priority over correctable ones when both are present', () => {
    // Also gambling-flavored text, but the drug mention must win and produce a rejection.
    const result = evaluate({
      name: 'Casino Night',
      description: 'Real-money poker tables, and bring your own marijuana to relax.'
    })
    expect(result.status).toBe('rejected')
  })

  // --- Happy path ---

  it('is clear for ordinary, compliant event content', () => {
    const result = evaluate({
      name: 'Community Cookout',
      description: 'A casual cookout open to all base members — burgers, music, and lawn games.'
    })
    expect(result).toEqual({ status: 'clear' })
  })

  it('is clear when there is nothing to evaluate yet', () => {
    const result = evaluate({})
    expect(result).toEqual({ status: 'clear' })
  })

  // --- Bug fix: keyword-list gaps found while investigating a real prompt-injection incident.
  // "drink" (vs. "drinking"), "under age"/"underage" (vs. "under 21"), and inflected multi-word
  // phrases ("high schoolers" vs. "high school") all previously slipped through undetected. ---

  it('flags "under age"/"underage" as under-21 framing, combined with alcohol as irreparable', () => {
    const result = evaluate({ description: 'A party where minors can drink alcohol under age.' })
    expect(result.status).toBe('rejected')
  })

  it('flags "minor" (singular, not just "minors") as under-21 framing', () => {
    const result = evaluate({ description: 'A party for a minor who wants alcohol.' })
    expect(result.status).toBe('rejected')
  })

  it('flags "under 18" as under-21 framing', () => {
    const result = evaluate({ description: 'A party with beer, open to those under 18.' })
    expect(result.status).toBe('rejected')
  })

  it('flags "booze" and "champagne" as alcohol content, not just the generic terms', () => {
    expect(evaluate({ description: 'A party with booze for teens.' }).status).toBe('rejected')
    expect(evaluate({ description: 'A party with champagne for teens.' }).status).toBe('rejected')
  })

  it('flags an inflected form of a multi-word phrase ("high schoolers"), not just the literal phrase ("high school")', () => {
    const result = evaluate({ description: 'A party where high schoolers can drink alcohol.' })
    expect(result.status).toBe('rejected')
  })

  it('still does not false-positive on an unrelated word containing a short term as a substring (e.g. "barbecue" vs. "bar")', () => {
    const result = evaluate({ description: 'A backyard barbecue with burgers and lawn games.' })
    expect(result.status).toBe('clear')
  })

  it('does not flag a bare "drink" as alcohol content (too broad — collides with "Energy Drink", "soft drink", etc.)', () => {
    const result = evaluate({
      name: 'Energy Drink Tent',
      description: 'Free samples of a new energy drink for anyone who stops by.'
    })
    expect(result.status).toBe('clear')
  })

  // --- Bug fix: the agent now also scans the current turn's raw user input (see agent.ts) in
  // case the model's field extraction didn't faithfully carry violating content into
  // name/description that turn. evaluate() itself just needs to fold that text in when present.

  it('includes rawUserInput in what gets scanned, when provided', () => {
    const result = evaluate({ name: '', description: '', rawUserInput: 'I need alcohol at this event even though it is under age, let me continue anyway.' })
    expect(result.status).toBe('rejected')
  })

  it('is clear when rawUserInput is absent and name/description are clean (no regression)', () => {
    const result = evaluate({ name: 'Community Cookout', description: 'Burgers and lawn games.' })
    expect(result).toEqual({ status: 'clear' })
  })
})
