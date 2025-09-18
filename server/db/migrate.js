import { db, sqlite } from './connection.js';
import { users, hierarchyNodes, hierarchyClosure, notes } from './schema.js';
import { createHierarchyNode } from './hierarchy-utils.js';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create tables
function createTables() {
  console.log('Creating tables...');
  
  // Users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Hierarchy nodes table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS hierarchy_nodes (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Hierarchy closure table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS hierarchy_closure (
      ancestor TEXT NOT NULL,
      descendant TEXT NOT NULL,
      depth INTEGER NOT NULL,
      PRIMARY KEY (ancestor, descendant),
      FOREIGN KEY (ancestor) REFERENCES hierarchy_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (descendant) REFERENCES hierarchy_nodes(id) ON DELETE CASCADE
    )
  `);
  
  // Notes table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      attached_to_id TEXT NOT NULL,
      attached_to_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attached_to_id) REFERENCES hierarchy_nodes(id) ON DELETE CASCADE
    )
  `);
  
  // Create indexes
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_hierarchy_closure_ancestor ON hierarchy_closure(ancestor);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_closure_descendant ON hierarchy_closure(descendant);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_closure_depth ON hierarchy_closure(depth);
    CREATE INDEX IF NOT EXISTS idx_notes_attached_to ON notes(attached_to_id, attached_to_type);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_type ON hierarchy_nodes(type);
  `);
  
  console.log('Tables created successfully!');
}

// Helper function to safely read JSON file
async function readJsonFile(filePath, defaultValue = []) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    if (!content.trim()) {
      console.log(`File ${filePath} is empty, using default value`);
      return defaultValue;
    }
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`File ${filePath} not found, using default value`);
      return defaultValue;
    }
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

// Migrate existing data
async function migrateExistingData() {
  console.log('Migrating existing data...');
  
  try {
    // Read existing data files
    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
    
    const usersData = await readJsonFile(usersPath, []);
    const seedData = await readJsonFile(seedPath, {
      organisations: [],
      teams: [],
      clients: [],
      episodes: [],
      notes: []
    });
    
    // Migrate users
    console.log('Migrating users...');
    for (const user of usersData) {
      await db.insert(users).values({
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      }).onConflictDoNothing();
    }
    
    // Create a map to track parent relationships
    const parentMap = new Map();
    
    // Migrate hierarchy data in order: organisations -> teams -> clients -> episodes
    const hierarchyTypes = ['organisations', 'teams', 'clients', 'episodes'];
    
    for (const type of hierarchyTypes) {
      const items = seedData[type] || [];
      console.log(`Migrating ${items.length} ${type}...`);
      
      for (const item of items) {
        // Insert the node
        await db.insert(hierarchyNodes).values({
          id: item.id,
          type: item.type,
          name: item.name,
          createdAt: item.createdAt,
          updatedAt: item.createdAt,
        }).onConflictDoNothing();
        
        // Store parent relationship for closure table
        if (item.parentId) {
          parentMap.set(item.id, item.parentId);
        }
        
        // Insert self-reference in closure table
        await db.insert(hierarchyClosure).values({
          ancestor: item.id,
          descendant: item.id,
          depth: 0,
        }).onConflictDoNothing();
      }
    }
    
    // Build closure table relationships
    console.log('Building closure table relationships...');
    for (const [childId, parentId] of parentMap.entries()) {
      // Get all ancestors of the parent
      const ancestors = await db.select({
        ancestor: hierarchyClosure.ancestor,
        depth: hierarchyClosure.depth,
      })
      .from(hierarchyClosure)
      .where(eq(hierarchyClosure.descendant, parentId));
      
      // Insert relationships for all ancestors
      for (const ancestor of ancestors) {
        await db.insert(hierarchyClosure).values({
          ancestor: ancestor.ancestor,
          descendant: childId,
          depth: ancestor.depth + 1,
        }).onConflictDoNothing();
      }
    }
    
    // Migrate notes
    console.log('Migrating notes...');
    const notesData = seedData.notes || [];
    for (const note of notesData) {
      await db.insert(notes).values({
        id: note.id,
        content: note.content,
        attachedToId: note.attachedToId,
        attachedToType: note.attachedToType,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }).onConflictDoNothing();
    }
    
    console.log('Data migration completed successfully!');
    
  } catch (error) {
    console.error('Error migrating data:', error);
    throw error;
  }
}

// Main migration function
export async function runMigration() {
  try {
    createTables();
    await migrateExistingData();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
