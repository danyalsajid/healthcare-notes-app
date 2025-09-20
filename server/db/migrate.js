import { db, sqlite } from './connection.js';
import { users, notes } from './schema.js';
import { createHierarchyNode } from './hierarchy-utils.js';

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
      tags TEXT DEFAULT '[]',
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


// Seed database with initial data using direct database commands
async function seedDatabase() {
  console.log('Seeding database with initial data...');
  
  try {
    // Seed users
    console.log('Creating default users...');
    const defaultUsers = [
      {
        id: 'user-1',
        username: 'admin',
        password: '$2b$10$oTT/NBnCnex7rgma0nAp/ug8dSuwDRwUB93JQQxLlGDCOHNYnYp.C', // password: Test@123
        email: 'admin@healthcare.com',
        name: 'Admin',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user-2',
        username: 'clinician',
        password: '$2b$10$oTT/NBnCnex7rgma0nAp/ug8dSuwDRwUB93JQQxLlGDCOHNYnYp.C', // password: Test@123
        email: 'clinician@healthcare.com',
        name: 'Clinician',
        role: 'clinician',
        createdAt: new Date().toISOString()
      }
    ];

    for (const user of defaultUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }
    
    // Seed organizations
    console.log('Creating organizations...');
    const org1 = await createHierarchyNode('organisation', 'City General Hospital');
    const org2 = await createHierarchyNode('organisation', 'Regional Medical Center');
    
    // Seed teams
    console.log('Creating teams...');
    const team1 = await createHierarchyNode('team', 'Cardiology Department', org1.id);
    const team2 = await createHierarchyNode('team', 'Emergency Department', org1.id);
    const team3 = await createHierarchyNode('team', 'Pediatrics', org2.id);
    
    // Seed clients
    console.log('Creating clients...');
    const client1 = await createHierarchyNode('client', 'John Smith', team1.id);
    const client2 = await createHierarchyNode('client', 'Sarah Johnson', team1.id);
    const client3 = await createHierarchyNode('client', 'Michael Brown', team2.id);
    
    // Seed episodes
    console.log('Creating episodes...');
    const episode1 = await createHierarchyNode('episode', 'Chest Pain Assessment', client1.id);
    const episode2 = await createHierarchyNode('episode', 'Follow-up Consultation', client1.id);
    const episode3 = await createHierarchyNode('episode', 'Routine Checkup', client2.id);
    
    // Seed notes
    console.log('Creating notes...');
    const seedNotes = [
      {
        id: 'note-1',
        content: 'Patient presents with chest pain. ECG shows normal sinus rhythm. Vital signs stable.',
        attachedToId: episode1.id,
        attachedToType: 'episode',
        tags: JSON.stringify(['Urgent', 'Assessment']),
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString()
      },
      {
        id: 'note-2',
        content: 'Cardiology department meeting scheduled for next week to discuss new protocols.',
        attachedToId: team1.id,
        attachedToType: 'team',
        tags: JSON.stringify(['Follow-up']),
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString()
      },
      {
        id: 'note-3',
        content: 'Patient education provided regarding heart-healthy lifestyle choices.',
        attachedToId: client1.id,
        attachedToType: 'client',
        tags: JSON.stringify([]),
        createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-01T00:00:00.000Z').toISOString()
      },
      {
        id: 'note-4',
        content: 'Prescribed Lisinopril 10mg daily for hypertension. Patient advised to monitor blood pressure at home.',
        attachedToId: episode2.id,
        attachedToType: 'episode',
        tags: JSON.stringify(['Medication', 'Follow-up']),
        createdAt: new Date('2024-01-02T08:30:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-02T08:30:00.000Z').toISOString()
      },
      {
        id: 'note-5',
        content: 'Emergency department protocol updated for triage procedures. All staff to review by end of week.',
        attachedToId: team2.id,
        attachedToType: 'team',
        tags: JSON.stringify(['Urgent']),
        createdAt: new Date('2024-01-02T10:15:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-02T10:15:00.000Z').toISOString()
      },
      {
        id: 'note-6',
        content: 'Patient reports improvement in symptoms. Blood pressure readings within normal range.',
        attachedToId: client2.id,
        attachedToType: 'client',
        tags: JSON.stringify(['Assessment']),
        createdAt: new Date('2024-01-03T14:20:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-03T14:20:00.000Z').toISOString()
      },
      {
        id: 'note-7',
        content: 'Routine checkup completed. All vital signs normal. Next appointment scheduled in 6 months.',
        attachedToId: episode3.id,
        attachedToType: 'episode',
        tags: JSON.stringify([]),
        createdAt: new Date('2024-01-03T16:45:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-03T16:45:00.000Z').toISOString()
      },
      {
        id: 'note-8',
        content: 'Patient experiencing severe allergic reaction. Administered epinephrine. Monitoring closely.',
        attachedToId: client3.id,
        attachedToType: 'client',
        tags: JSON.stringify(['Urgent', 'Medication']),
        createdAt: new Date('2024-01-04T11:30:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-04T11:30:00.000Z').toISOString()
      },
      {
        id: 'note-9',
        content: 'New pediatric guidelines received from health ministry. Training session to be organized.',
        attachedToId: team3.id,
        attachedToType: 'team',
        tags: JSON.stringify(['Follow-up']),
        createdAt: new Date('2024-01-04T13:00:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-04T13:00:00.000Z').toISOString()
      },
      {
        id: 'note-10',
        content: 'Patient discharged with home care instructions. Family members briefed on care procedures.',
        attachedToId: org1.id,
        attachedToType: 'organisation',
        tags: JSON.stringify([]),
        createdAt: new Date('2024-01-05T09:15:00.000Z').toISOString(),
        updatedAt: new Date('2024-01-05T09:15:00.000Z').toISOString()
      }
    ];

    for (const note of seedNotes) {
      await db.insert(notes).values(note).onConflictDoNothing();
    }
    
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Main migration function
export async function runMigration() {
  try {
    createTables();
    await seedDatabase();
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
