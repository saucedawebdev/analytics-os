import { useEffect, useState } from 'react'

export function useLiveQuery<T>(queryFn: () => Promise<T>, deps: unknown[], initial: T): T {
  const [data, setData] = useState<T>(initial)

  useEffect(() => {
    let cancelled = false
    void queryFn().then((v) => {
      if (!cancelled) setData(v)
    })
    return () => {
      cancelled = true
    }
  }, [queryFn, ...deps])

  return data
}
