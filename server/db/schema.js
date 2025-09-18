import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Hierarchy nodes table - stores all hierarchical entities
export const hierarchyNodes = sqliteTable('hierarchy_nodes', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'organisation', 'team', 'client', 'episode'
  name: text('name').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Closure table for hierarchy relationships
export const hierarchyClosure = sqliteTable('hierarchy_closure', {
  ancestor: text('ancestor').notNull().references(() => hierarchyNodes.id, { onDelete: 'cascade' }),
  descendant: text('descendant').notNull().references(() => hierarchyNodes.id, { onDelete: 'cascade' }),
  depth: integer('depth').notNull(), // 0 = self, 1 = direct child, 2 = grandchild, etc.
}, (table) => ({
  pk: primaryKey({ columns: [table.ancestor, table.descendant] }),
}));

// Notes table
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  attachedToId: text('attached_to_id').notNull().references(() => hierarchyNodes.id, { onDelete: 'cascade' }),
  attachedToType: text('attached_to_type').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Indexes for better performance
export const hierarchyClosureIndexes = {
  ancestorIndex: sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_closure_ancestor ON hierarchy_closure(ancestor)`,
  descendantIndex: sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_closure_descendant ON hierarchy_closure(descendant)`,
  depthIndex: sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_closure_depth ON hierarchy_closure(depth)`,
};

export const notesIndexes = {
  attachedToIndex: sql`CREATE INDEX IF NOT EXISTS idx_notes_attached_to ON notes(attached_to_id, attached_to_type)`,
};

export const hierarchyNodesIndexes = {
  typeIndex: sql`CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_type ON hierarchy_nodes(type)`,
};
