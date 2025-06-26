
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="h-7 md:h-8 px-2 md:px-3"
    >
      <Sun className="h-3 w-3 md:h-4 md:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3 w-3 md:h-4 md:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
