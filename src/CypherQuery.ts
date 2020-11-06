import { mergeAll, prop } from 'ramda'
import { Neo4jSerializable, Neo4jSerializableObject } from './types'
import { Driver } from 'neo4j-driver'
import { CypherResultType, unify } from './unify'

let varCounter = -1

type QueryParameters = {
  query: string
  params: Neo4jSerializableObject
}

const toQuery = (value: CypherQuery | Neo4jSerializable): QueryParameters =>
  value instanceof CypherQuery
    ? value.toQuery()
    : {
        query: `$v${varCounter}`,
        params: { [`v${varCounter++}`]: value }
      }

const getResults = (
  strings: string[],
  values: Array<CypherQuery | Neo4jSerializable>
): QueryParameters[] =>
  values.map(toQuery).map(({ query, params }, index) => ({
    query: `${query}${strings[index]}`,
    params
  }))

export class CypherQuery {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public strings: TemplateStringsArray | string[],
    public values: Array<CypherQuery | Neo4jSerializable>
  ) {}

  toQuery() {
    const isExternalCall = varCounter === -1
    if (isExternalCall) {
      varCounter = 0
    }
    const [prefixString, ...strings] = this.strings
    const results = getResults(strings, this.values)
    if (isExternalCall) {
      varCounter = -1
    }
    return {
      query: results.reduce((s, { query }) => `${s}${query}`, prefixString),
      params: mergeAll(results.map(prop(`params`)))
    }
  }

  *[Symbol.iterator]() {
    const { query, params } = this.toQuery()

    yield query
    yield params
  }
}

const handleTemplateTag = (
  strings: TemplateStringsArray | string[],
  ...args: Array<CypherQuery | Neo4jSerializable>
) => new CypherQuery(strings, args)
const handleObjectTag = (
  object: Neo4jSerializableObject,
  keys: Array<keyof Neo4jSerializableObject> = Object.keys(object)
) =>
  new CypherQuery(
    [...keys.map(key => `${key}:`), ``],
    keys.map(key => object[key])
  )

const handleRawTag = (string: string) => new CypherQuery([string], [])

export function tag(
  ...args:
    | Parameters<typeof handleTemplateTag>
    | Parameters<typeof handleRawTag>
    | Parameters<typeof handleObjectTag>
): CypherQuery {
  switch (true) {
    case Array.isArray(args[0]):
      return handleTemplateTag(
        ...(args as Parameters<typeof handleTemplateTag>)
      )
    case args[0] instanceof Object && args[0] !== null:
      return handleObjectTag(...(args as Parameters<typeof handleObjectTag>))
    case args.length === 1 && typeof args[0] === `string`:
      return handleRawTag(args[0] as string)
    default:
      throw new TypeError(`unsupported arguments`)
  }
}

export const run = (
  ...args:
    | Parameters<typeof handleTemplateTag>
    | Parameters<typeof handleRawTag>
    | Parameters<typeof handleObjectTag>
) => (driver: Driver): Promise<CypherResultType> =>
  driver
    .session()
    // @ts-ignore
    .run(...tag(...args))
    .then(unify)
