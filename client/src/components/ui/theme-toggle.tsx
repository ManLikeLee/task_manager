import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '@/app/ThemeProvider'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-xs font-medium text-[rgb(var(--text-muted))] shadow-sm hover:bg-[rgb(var(--hover))] hover:text-[rgb(var(--text))]"
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}
