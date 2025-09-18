import { db } from './connection.js';
import { hierarchyNodes, hierarchyClosure, notes } from './schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Create a new hierarchy node and establish closure table relationships
 */
export async function createHierarchyNode(type, name, parentId = null) {
  const id = randomUUID();
  const now = new Date().toISOString();
  
  return db.transaction((tx) => {
    // Insert the new node
    tx.insert(hierarchyNodes).values({
      id,
      type,
      name,
      createdAt: now,
      updatedAt: now,
    }).run();
    
    // Insert self-reference in closure table (depth 0)
    tx.insert(hierarchyClosure).values({
      ancestor: id,
      descendant: id,
      depth: 0,
    }).run();
    
    // If there's a parent, insert all ancestor relationships
    if (parentId) {
      // Insert relationships for all ancestors of the parent
      const ancestorQuery = tx.select({
        ancestor: hierarchyClosure.ancestor,
        depth: sql`${hierarchyClosure.depth} + 1`.as('depth'),
      })
      .from(hierarchyClosure)
      .where(eq(hierarchyClosure.descendant, parentId));
      
      const ancestors = ancestorQuery.all();
      
      for (const ancestor of ancestors) {
        tx.insert(hierarchyClosure).values({
          ancestor: ancestor.ancestor,
          descendant: id,
          depth: ancestor.depth,
        }).run();
      }
    }
    
    return { id, type, name, parentId, createdAt: now };
  });
}

/**
 * Get all children of a node at a specific depth (1 = direct children)
 */
export async function getChildren(nodeId, depth = 1) {
  return db.select({
    id: hierarchyNodes.id,
    type: hierarchyNodes.type,
    name: hierarchyNodes.name,
    createdAt: hierarchyNodes.createdAt,
    updatedAt: hierarchyNodes.updatedAt,
  })
  .from(hierarchyNodes)
  .innerJoin(hierarchyClosure, eq(hierarchyNodes.id, hierarchyClosure.descendant))
  .where(and(
    eq(hierarchyClosure.ancestor, nodeId),
    eq(hierarchyClosure.depth, depth)
  ))
  .orderBy(hierarchyNodes.createdAt);
}

/**
 * Get all descendants of a node (all levels)
 */
export async function getAllDescendants(nodeId) {
  return db.select({
    id: hierarchyNodes.id,
    type: hierarchyNodes.type,
    name: hierarchyNodes.name,
    depth: hierarchyClosure.depth,
    createdAt: hierarchyNodes.createdAt,
    updatedAt: hierarchyNodes.updatedAt,
  })
  .from(hierarchyNodes)
  .innerJoin(hierarchyClosure, eq(hierarchyNodes.id, hierarchyClosure.descendant))
  .where(and(
    eq(hierarchyClosure.ancestor, nodeId),
    sql`${hierarchyClosure.depth} > 0`
  ))
  .orderBy(hierarchyClosure.depth, hierarchyNodes.createdAt);
}

/**
 * Get all ancestors of a node
 */
export async function getAncestors(nodeId) {
  return db.select({
    id: hierarchyNodes.id,
    type: hierarchyNodes.type,
    name: hierarchyNodes.name,
    depth: hierarchyClosure.depth,
    createdAt: hierarchyNodes.createdAt,
    updatedAt: hierarchyNodes.updatedAt,
  })
  .from(hierarchyNodes)
  .innerJoin(hierarchyClosure, eq(hierarchyNodes.id, hierarchyClosure.ancestor))
  .where(and(
    eq(hierarchyClosure.descendant, nodeId),
    sql`${hierarchyClosure.depth} > 0`
  ))
  .orderBy(hierarchyClosure.depth);
}

/**
 * Get the direct parent of a node
 */
export async function getParent(nodeId) {
  const parents = await db.select({
    id: hierarchyNodes.id,
    type: hierarchyNodes.type,
    name: hierarchyNodes.name,
    createdAt: hierarchyNodes.createdAt,
    updatedAt: hierarchyNodes.updatedAt,
  })
  .from(hierarchyNodes)
  .innerJoin(hierarchyClosure, eq(hierarchyNodes.id, hierarchyClosure.ancestor))
  .where(and(
    eq(hierarchyClosure.descendant, nodeId),
    eq(hierarchyClosure.depth, 1)
  ))
  .limit(1);
  
  return parents[0] || null;
}

/**
 * Delete a node and all its descendants
 */
export async function deleteNodeAndDescendants(nodeId) {
  return db.transaction((tx) => {
    // Get all descendants (including self)
    const descendants = tx.select({
      id: hierarchyClosure.descendant,
    })
    .from(hierarchyClosure)
    .where(eq(hierarchyClosure.ancestor, nodeId))
    .all();
    
    const descendantIds = descendants.map(d => d.id);
    
    // Delete all notes attached to these nodes
    for (const id of descendantIds) {
      tx.delete(notes).where(eq(notes.attachedToId, id)).run();
    }
    
    // Delete closure table entries
    for (const id of descendantIds) {
      tx.delete(hierarchyClosure).where(eq(hierarchyClosure.descendant, id)).run();
      tx.delete(hierarchyClosure).where(eq(hierarchyClosure.ancestor, id)).run();
    }
    
    // Delete the nodes themselves
    for (const id of descendantIds) {
      tx.delete(hierarchyNodes).where(eq(hierarchyNodes.id, id)).run();
    }
    
    return descendantIds.length;
  });
}

/**
 * Update a node's name
 */
export async function updateNode(nodeId, name) {
  const now = new Date().toISOString();
  
  const result = await db.update(hierarchyNodes)
    .set({ 
      name, 
      updatedAt: now 
    })
    .where(eq(hierarchyNodes.id, nodeId))
    .returning();
  
  return result[0];
}

/**
 * Get nodes by type (e.g., all organisations)
 */
export async function getNodesByType(type) {
  return db.select()
    .from(hierarchyNodes)
    .where(eq(hierarchyNodes.type, type))
    .orderBy(hierarchyNodes.createdAt);
}

/**
 * Get a single node by ID
 */
export async function getNodeById(nodeId) {
  const result = await db.select()
    .from(hierarchyNodes)
    .where(eq(hierarchyNodes.id, nodeId))
    .limit(1);
  
  return result[0] || null;
}
