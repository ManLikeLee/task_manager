import { useEffect } from 'react'

const APP_TITLE = 'TaskForce'

const formatTitle = (title?: string | null) => {
  const cleanTitle = String(title || '').trim()
  if (!cleanTitle) return APP_TITLE
  return `${cleanTitle} – ${APP_TITLE}`
}

export const usePageTitle = (title?: string | null) => {
  useEffect(() => {
    document.title = formatTitle(title)
  }, [title])
}
