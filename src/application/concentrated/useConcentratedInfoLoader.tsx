import { useMemo } from 'react'
import { useRouter } from 'next/router'

import { AmmV3, ApiAmmV3PoolsItem } from '@raydium-io/raydium-sdk'

import useToken from '@/application/token/useToken'
import jFetch from '@/functions/dom/jFetch'
import toPubString from '@/functions/format/toMintString'
import { isInBonsaiTest, isInLocalhost } from '@/functions/judgers/isSSR'
import { lazyMap } from '@/functions/lazyMap'
import useAsyncEffect from '@/hooks/useAsyncEffect'
import { useRecordedEffect } from '@/hooks/useRecordedEffect'
import { useTransitionedEffect } from '@/hooks/useTransitionedEffect'

import useAppAdvancedSettings from '../common/useAppAdvancedSettings'
import useConnection from '../connection/useConnection'
import useWallet from '../wallet/useWallet'

import hydrateConcentratedInfo from './hydrateConcentratedInfo'
import useConcentrated from './useConcentrated'

/**
 * will load concentrated info (jsonInfo, sdkParsedInfo, hydratedInfo)
 * @todo just register hooks in specific component
 */
export default function useConcentratedInfoLoader() {
  const apiAmmPools = useConcentrated((s) => s.apiAmmPools)
  const sdkParsedAmmPools = useConcentrated((s) => s.sdkParsedAmmPools)
  const currentAmmPool = useConcentrated((s) => s.currentAmmPool)
  const refreshCount = useConcentrated((s) => s.refreshCount)
  const lazyLoadChart = useConcentrated((s) => s.lazyLoadChart)
  const loadChartPointsAct = useConcentrated((s) => s.loadChartPointsAct)
  const connection = useConnection((s) => s.connection)
  const chainTimeOffset = useConnection((s) => s.chainTimeOffset)
  const tokenAccounts = useWallet((s) => s.tokenAccountRawInfos)
  const owner = useWallet((s) => s.owner)
  const tokenAccountsOwner = useWallet((s) => s.tokenAccountsOwner)
  const tokens = useToken((s) => s.tokens)
  const hydratedAmmPools = useConcentrated((s) => s.hydratedAmmPools)
  const { pathname } = useRouter()
  const apiUrls = useAppAdvancedSettings((s) => s.apiUrls)
  const ammV3PoolsUrl = useAppAdvancedSettings((s) => s.apiUrls.ammV3Pools)

  const shouldLoadInfo = useMemo(() => pathname.includes('clmm'), [pathname.includes('clmm')])
  const shouldLoadChartPoints = useMemo(
    () => pathname.includes('clmm') && !pathname.includes('create-pool'),
    [pathname.includes('clmm'), pathname.includes('create-pools')]
  )

  /** fetch api json info list  */
  useRecordedEffect(
    async ([prevRefreshCount]) => {
      const shouldForceRefresh = prevRefreshCount != null && refreshCount !== prevRefreshCount
      if (!shouldForceRefresh && !shouldLoadInfo) return
      if (prevRefreshCount === refreshCount && apiAmmPools.length) return
      const response = await jFetch<{ data: ApiAmmV3PoolsItem[] }>(ammV3PoolsUrl) // note: previously Rudy has Test API for dev
      if (ammV3PoolsUrl !== apiUrls.ammV3Pools) return
      useConcentrated.setState({ apiAmmPools: response?.data })
    },
    [refreshCount, ammV3PoolsUrl, shouldLoadInfo]
  )

  /**  api json info list ➡ SDK info list */
  useTransitionedEffect(async () => {
    if (!connection) return
    if (chainTimeOffset == null) return
    if (!apiAmmPools || apiAmmPools.length === 0) return
    const sdkParsed = await AmmV3.fetchMultiplePoolInfos({
      poolKeys: apiAmmPools,
      connection,
      ownerInfo: owner ? { tokenAccounts: tokenAccounts, wallet: owner } : undefined,
      chainTime: (Date.now() + chainTimeOffset) / 1000,
      batchRequest: !isInLocalhost && !isInBonsaiTest
    })
    if (sdkParsed) {
      useConcentrated.setState({ sdkParsedAmmPools: Object.values(sdkParsed), originSdkParsedAmmPools: sdkParsed })
    }
  }, [apiAmmPools, connection, toPubString(owner), toPubString(tokenAccountsOwner), chainTimeOffset, tokenAccounts])

  /** SDK info list ➡ hydrated info list */
  useTransitionedEffect(async () => {
    if (!connection) return // don't hydrate when connection is not ready
    if (!Object.keys(tokens).length) return // don't hydrate when token is not loaded
    if (!sdkParsedAmmPools || sdkParsedAmmPools.length === 0) return
    const sdkParsedAmmPoolsList = Object.values(sdkParsedAmmPools)
    const hydratedInfos = await lazyMap({
      source: sdkParsedAmmPoolsList,
      loopTaskName: 'hydrate clmm pool Info',
      loopFn: (sdkParsed) => hydrateConcentratedInfo(sdkParsed),
      options: { priority: shouldLoadInfo ? 1 : 0 }
    })

    useConcentrated.setState({ hydratedAmmPools: hydratedInfos, loading: hydratedInfos.length === 0 })
  }, [sdkParsedAmmPools, connection, tokens, shouldLoadInfo])

  /** select pool chart data */
  useTransitionedEffect(async () => {
    if (lazyLoadChart) return
    if (!currentAmmPool) {
      useConcentrated.setState({ chartPoints: [] })
      return
    }
    if (!shouldLoadChartPoints) return
    loadChartPointsAct(toPubString(currentAmmPool.state.id))
  }, [currentAmmPool?.idString, tokens, lazyLoadChart, loadChartPointsAct, shouldLoadChartPoints])

  /** update currentAmmPool */
  useTransitionedEffect(async () => {
    if (!currentAmmPool || !currentAmmPool.idString) return
    if (hydratedAmmPools) {
      const targetPool = hydratedAmmPools.filter((i) => i.idString === currentAmmPool.idString)
      if (targetPool.length === 1) {
        useConcentrated.setState({ currentAmmPool: targetPool[0] })
      }
    }
  }, [currentAmmPool?.idString, hydratedAmmPools])

  // auto clean chart data
  useAsyncEffect(async () => {
    useConcentrated.setState({ chartPoints: undefined })
  }, [pathname])

  /** reload points chart */
  useAsyncEffect(async () => {
    if (!currentAmmPool) return
    if (!shouldLoadChartPoints) return
    loadChartPointsAct(toPubString(currentAmmPool.state.id), { force: true })
  }, [refreshCount, shouldLoadChartPoints])
}
