import * as neo4j from 'neo4j-driver'
import { NumberOrInteger, StandardDate } from 'neo4j-driver/types/graph-types'

export type Neo4jSerializable =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]

export type Neo4jSerializableObject = { [key: string]: Neo4jSerializable }

export type Neo4jPrimitiveType = NumberOrInteger | StandardDate | string

export type Neo4jResultType =
  | neo4j.Node
  | neo4j.Relationship
  | neo4j.UnboundRelationship
  | Neo4jPrimitiveType
  | Neo4jPrimitiveType[]
  | Record<string, Neo4jPrimitiveType>

// eslint-disable-next-line quotes
declare module 'neo4j-driver/types/record' {
  export default class Record {
    entries(): IterableIterator<[string, Neo4jResultType]>

    values(): IterableIterator<Neo4jResultType>

    [Symbol.iterator](): IterableIterator<Neo4jResultType>

    toObject(): {
      [key: string]: Neo4jResultType
    }
  }
}
