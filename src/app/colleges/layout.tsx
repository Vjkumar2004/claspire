import { metadata } from './metadata'
import CollegesPage from './page'

export { metadata }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
