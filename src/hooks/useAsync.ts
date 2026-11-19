import { useEffect, useState } from 'react'

/** 데이터 불러오기: 결과와 오류를 함께 돌려준다 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | null; error: Error | null } {
  const [state, setState] = useState<{ data: T | null; error: Error | null }>({ data: null, error: null })
  useEffect(() => {
    let alive = true
    fn().then(
      (data) => alive && setState({ data, error: null }),
      (error: Error) => alive && setState({ data: null, error }),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
