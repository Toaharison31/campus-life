import { createContext, useContext } from 'react'

export const CampusContext = createContext(null)
export const useCampus = () => useContext(CampusContext)
