import { useState, useContext, useEffect } from 'react'
import { run } from './CypherQuery'
import { neo4jConnectionContext } from './Neo4jConnectionProvider'
import { Neo4jSerializable } from './types'
import { CypherResultType } from './unify'

const useLoadingState = () =>
  useState<
    | {
        loading: true
        result: null
        error: null
      }
    | {
        loading: false
        result: CypherResultType
        error: null
      }
    | {
        loading: false
        result: null
        error: Error
      }
  >({
    loading: true,
    result: null,
    error: null
  })

export const useCypher = (
  strings: TemplateStringsArray,
  ...args: Array<Neo4jSerializable>
) => {
  const driver = useContext(neo4jConnectionContext)
  if (!driver) {
    throw new Error(`no Neo4jConnection provided`)
  }

  const [state, setState] = useLoadingState()

  useEffect(() => {
    run(
      strings,
      ...args
    )(driver)
      .then(
        result => ({ loading: false, result: result, error: null }),
        error => ({ loading: false, result: null, error })
      )
      .then(setState)
  }, [...strings, ...args])

  return [state]
}
