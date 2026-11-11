import { useEffect, useState } from 'react'
import { readData, writeData } from '../services/storage'

export function useLocalStorage(key, collection) {
  const [value, setValue] = useState(() => readData(key, collection))
  useEffect(() => writeData(key, value), [key, value])
  return [value, setValue]
}
