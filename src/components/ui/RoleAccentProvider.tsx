import { createContext, useContext } from 'react'
import type { PropsWithChildren } from 'react'

import { getRoleAccent, getRoleSoftAccent, type CreedaRole } from '../../theme/creedaTokens'

type RoleAccentContextValue = {
  role: CreedaRole | null
  accent: string
  softAccent: string
}

const RoleAccentContext = createContext<RoleAccentContextValue>({
  role: null,
  accent: getRoleAccent(null),
  softAccent: getRoleSoftAccent(null),
})

export function RoleAccentProvider({
  children,
  role,
}: PropsWithChildren<{ role: CreedaRole | null | undefined }>) {
  return (
    <RoleAccentContext.Provider
      value={{
        role: role ?? null,
        accent: getRoleAccent(role),
        softAccent: getRoleSoftAccent(role),
      }}
    >
      {children}
    </RoleAccentContext.Provider>
  )
}

export function useRoleAccent() {
  return useContext(RoleAccentContext)
}
