import { frontendTextWidth, type FrontendTextRow } from './frontend-composition.ts'

// Menu2 paragraph519. Keep the supplied English wording, including "recommended".
export const tutorialRecommendationText =
  'As this is your first time playing Populous: The Beginning, we recommended that you follow the Tutorial which teaches you how to play the game. Do you want to start the Tutorial now?'

// Browser adaptation: retained native evidence supplies width600 and spacing30,
// but not the paragraph's post-render callback004c5b20 or its final button layout.
export function wrapTutorialRecommendation(text: string): string[] {
  const lines: string[] = []
  for (const word of text.split(' ')) {
    const previous = lines.at(-1)
    const candidate = previous ? `${previous} ${word}` : word
    if (previous && frontendTextWidth(candidate) <= 600) lines[lines.length - 1] = candidate
    else lines.push(word)
  }
  return lines
}
export const tutorialParagraphRows: readonly FrontendTextRow[] = wrapTutorialRecommendation(
  tutorialRecommendationText
).map((text, index) => ({ text, x: 320, y: 159 + index * 30 }))
export const tutorialChoiceRows: readonly FrontendTextRow[] = [
  { text: 'Yes', x: 320, y: 159 + tutorialParagraphRows.length * 30 },
  { text: 'No', x: 320, y: 189 + tutorialParagraphRows.length * 30 },
  { text: 'Back', x: 320, y: 454 },
]
export const tutorialRecommendationRows = [...tutorialParagraphRows, ...tutorialChoiceRows]

export const TUTORIAL_RECOMMENDATION_KEY = 'populous-tutorial-recommendation-v1'
let answeredThisPage = false

// Browser-local onboarding preference, never a native profile bit or checkpoint.
// Access storage only from user actions, keeping SSR and blocked storage safe.
export function hasAnsweredTutorialRecommendation(): boolean {
  if (answeredThisPage) return true
  try {
    return localStorage.getItem(TUTORIAL_RECOMMENDATION_KEY) === 'answered'
  } catch {
    return false
  }
}
export function answerTutorialRecommendation(): void {
  answeredThisPage = true
  try {
    localStorage.setItem(TUTORIAL_RECOMMENDATION_KEY, 'answered')
  } catch {
    // The choice still applies for this page's lifetime if persistence is blocked.
  }
}
