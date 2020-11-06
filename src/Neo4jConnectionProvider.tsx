// eslint-disable-next-line no-use-before-define
import * as React from 'react'
import { createContext, PropsWithChildren } from 'react'
import neo4j, { AuthToken, Config, Driver } from 'neo4j-driver'

export const neo4jConnectionContext = createContext<void | Driver>(undefined)

export const Neo4jConnectionProvider = ({
  url,
  authToken,
  children,
  ...props
}: PropsWithChildren<
  {
    url: string
    authToken: AuthToken
  } & Partial<Config>
>) => {
  return (
    <neo4jConnectionContext.Provider
      value={neo4j.driver(url, authToken, props)}>
      {children}
    </neo4jConnectionContext.Provider>
  )
}
