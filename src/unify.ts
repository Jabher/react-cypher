import type * as neo4j from 'neo4j-driver'
import {
  Neo4jPrimitiveType,
  Neo4jResultType,
  Neo4jSerializableObject
} from './types'
import { mapObjIndexed, uniqBy } from 'ramda'
import { Node, Relationship, types, UnboundRelationship } from 'neo4j-driver'

export enum EntityKind {
  Node = `node`,
  Edge = `edge`
}

export type INode<T> = T & {
  $kind: EntityKind.Node
}

export type IEdge<T> = T & {
  $kind: EntityKind.Edge
}

export type CypherResultType =
  | Neo4jPrimitiveType
  | Neo4jSerializableObject
  | INode<any>
  | IEdge<any>

// @ts-ignore
const isNode = (type: unknown): type is Node => type instanceof types.Node
const isRelation = (type: unknown): type is Relationship =>
  // @ts-ignore
  type instanceof types.Relationship
const isUnboundRelation = (type: unknown): type is UnboundRelationship =>
  // @ts-ignore
  type instanceof types.UnboundRelationship

export const unify = ({ records }: neo4j.QueryResult) => {
  const nodeRegistry = new Map()
  const relationshipRegistry = new Map()
  for (const record of records) {
    for (const item of record.values()) {
      if (isNode(item)) {
        nodeRegistry.set(item.identity.toString(10), item)
      } else if (isRelation(item) || isUnboundRelation(item)) {
        relationshipRegistry.set(item.identity.toString(10), item)
      }
    }
  }

  const buildNode = <T>(node: Node): INode<T> =>
    Object.defineProperties(
      { ...node.properties },
      {
        $identity: { value: node.identity },
        $labels: { value: node.labels },
        $kind: { value: EntityKind.Node },
        toString: {
          value() {
            return `Edge:${this.$labels.join(`:`)}`
          }
        }
      }
    )
  const buildEdge = <T>(edge: Relationship): IEdge<T> =>
    Object.defineProperties(
      { ...edge.properties },
      {
        $identity: { value: edge.identity },
        $type: { value: edge.type },
        $kind: { value: EntityKind.Edge },
        $from: { value: nodeRegistry.get(edge.start.toString(10)) },
        $to: { value: nodeRegistry.get(edge.end.toString(10)) },
        toString: {
          value() {
            return `Edge:${this.$type}`
          }
        }
      }
    )
  const buildUnboundEdge = <T>(edge: UnboundRelationship): IEdge<T> =>
    Object.defineProperties(
      { ...edge.properties },
      {
        $identity: { value: edge.identity },
        $type: { value: edge.type },
        $kind: { value: EntityKind.Edge },
        toString: {
          value() {
            return `Edge:${this.$type}`
          }
        }
      }
    )

  const struct: { [key: string]: CypherResultType[] } = {}

  const transformValue = (value: Neo4jResultType) => {
    if (isNode(value)) {
      return buildNode(value)
    } else if (isRelation(value)) {
      return buildEdge(value)
    } else if (isUnboundRelation(value)) {
      return buildUnboundEdge(value)
    } else {
      return value
    }
  }

  for (const record of records) {
    for (const [key, value] of record.entries()) {
      if (!struct[key]) {
        struct[key] = []
      }
      struct[key].push(transformValue(value))
    }
  }

  return mapObjIndexed(
    uniqBy(record => (record.$identity ? record.$identity.toString() : record)),
    struct
  )
}
