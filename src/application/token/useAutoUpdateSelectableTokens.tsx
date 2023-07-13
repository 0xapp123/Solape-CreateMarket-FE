import { useEffect, useMemo } from 'react'

import useWallet from '@/application/wallet/useWallet'
import toPubString from '@/functions/format/toMintString'

import useToken, { USER_ADDED_TOKEN_LIST_NAME } from './useToken'

/**
 * a feature hook
 * base on user's token list settings, load corresponding tokens
 */
export default function useAutoUpdateSelectableTokens() {
  const verboseTokens = useToken((s) => s.verboseTokens)
  const userAddedTokens = useToken((s) => s.userAddedTokens)
  const tokenListSettings = useToken((s) => s.tokenListSettings)
  const userFlaggedTokenMints = useToken((s) => s.userFlaggedTokenMints)
  const sortTokens = useToken((s) => s.sortTokensWithBalance)
  const balances = useWallet((s) => s.balances)

  // only user opened token list
  const settingsFiltedTokens = useMemo(() => {
    const activeTokenListNames = Object.entries(tokenListSettings)
      .filter(([, setting]) => setting.isOn)
      .map(([name]) => name)

    const havUserAddedTokens = activeTokenListNames.some(
      (tokenListName) => tokenListName === USER_ADDED_TOKEN_LIST_NAME
    )

    const verboseTokensMints = verboseTokens.map((t) => toPubString(t.mint))
    const filteredUserAddedTokens = (havUserAddedTokens ? Object.values(userAddedTokens) : []).filter(
      (i) => !verboseTokensMints.includes(toPubString(i.mint))
    )

    return [...verboseTokens, ...filteredUserAddedTokens]
      .filter((token) => {
        const isUserFlagged =
          tokenListSettings[USER_ADDED_TOKEN_LIST_NAME] && userFlaggedTokenMints.has(toPubString(token.mint))
        const isOnByTokenList = activeTokenListNames.some((tokenListName) =>
          tokenListSettings[tokenListName]?.mints?.has(toPubString(token.mint))
        )
        return isUserFlagged || isOnByTokenList
      })
      .map((t) => {
        const tPubString = toPubString(t.mint)
        if (userAddedTokens[tPubString]) {
          t.symbol = userAddedTokens[tPubString].symbol
          t.name = userAddedTokens[tPubString].name
            ? userAddedTokens[tPubString].name
            : userAddedTokens[tPubString].symbol
        }
        return t
      })
  }, [verboseTokens, userAddedTokens, tokenListSettings, userAddedTokens])

  // have sorted
  const sortedTokens = useMemo(
    () => sortTokens(settingsFiltedTokens),
    [settingsFiltedTokens, sortTokens, balances, verboseTokens.length]
  )

  useEffect(() => {
    useToken.setState({
      allSelectableTokens: sortedTokens
    })
  }, [sortedTokens])
}
