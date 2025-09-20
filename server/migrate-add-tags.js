import { db } from './db/connection.js';

async function addTagsColumn() {
  try {
    console.log('Adding tags column to notes table...');
    
    // Add the tags column to the existing notes table
    await db.run(`ALTER TABLE notes ADD COLUMN tags TEXT`);
    
    console.log('✅ Successfully added tags column to notes table');
    console.log('Migration completed!');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ Tags column already exists, skipping migration');
    } else {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

// Run the migration
addTagsColumn()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
