const skipKeyForUser = (userId: string) => `taskforce.onboardingSkipped.${userId}`
const SKIP_EVENT = 'taskforce:onboarding-skip-changed'

const emitSkipChange = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SKIP_EVENT))
}

export const hasSkippedWorkspaceOnboarding = (userId?: string) => {
  if (!userId || typeof window === 'undefined') return false
  return window.localStorage.getItem(skipKeyForUser(userId)) === '1'
}

export const markWorkspaceOnboardingSkipped = (userId?: string) => {
  if (!userId || typeof window === 'undefined') return
  window.localStorage.setItem(skipKeyForUser(userId), '1')
  emitSkipChange()
}

export const clearWorkspaceOnboardingSkipped = (userId?: string) => {
  if (!userId || typeof window === 'undefined') return
  window.localStorage.removeItem(skipKeyForUser(userId))
  emitSkipChange()
}

export const onboardingSkipEventName = SKIP_EVENT
