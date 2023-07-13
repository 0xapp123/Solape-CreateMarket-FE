import { useEffect } from 'react'
import { clearApiCache, clearSdkCache } from '../ammV3PoolInfoAndLiquidity/ammAndLiquidity'
import { useAppAdvancedSettings } from './useAppAdvancedSettings'

/**
 * reflect api change
 */

export function useApiUrlChange() {
  const programIds = useAppAdvancedSettings((s) => s.programIds)
  const ammPoolsUrl = useAppAdvancedSettings((s) => s.apiUrls.ammV3Pools)
  const liquidityPoolsUrl = useAppAdvancedSettings((s) => s.apiUrls.poolInfo)
  useEffect(() => {
    clearApiCache()
    clearSdkCache()
  }, [ammPoolsUrl, liquidityPoolsUrl, programIds])
}
