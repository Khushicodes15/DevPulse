import { createContext, useContext } from 'react'

const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export { AppContext }