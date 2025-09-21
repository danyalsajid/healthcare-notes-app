import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database imports
import { db } from './db/connection.js';
import { users, notes } from './db/schema.js';
import { 
  createHierarchyNode, 
  getChildren, 
  getParent, 
  deleteNodeAndDescendants, 
  updateNode, 
  getNodesByType, 
  getNodeById 
} from './db/hierarchy-utils.js';
import { eq, and } from 'drizzle-orm';

const app = express();

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'healthcare-notes-secret-key-2024';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// CORS for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

app.use(express.json());

app.use(session({
  secret: 'healthcare-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Generate unique ID
const generateId = () => randomUUID();

// Helper function to build hierarchical data
async function buildHierarchicalData() {
  const organisations = await getNodesByType('organisation');
  const result = {
    organisations: [],
    teams: [],
    clients: [],
    episodes: [],
    notes: []
  };

  // Get all nodes
  for (const org of organisations) {
    result.organisations.push(org);
    
    const teams = await getChildren(org.id);
    for (const team of teams) {
      result.teams.push({ ...team, parentId: org.id });
      
      const clients = await getChildren(team.id);
      for (const client of clients) {
        result.clients.push({ ...client, parentId: team.id });
        
        const episodes = await getChildren(client.id);
        for (const episode of episodes) {
          result.episodes.push({ ...episode, parentId: client.id });
        }
      }
    }
  }

  // Get all notes
  const allNotes = await db.select().from(notes);
  result.notes = allNotes.map(note => ({
    id: note.id,
    content: note.content,
    attachedToId: note.attachedToId,
    attachedToType: note.attachedToType,
    tags: note.tags ? JSON.parse(note.tags) : [],
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  }));

  return result;
}

////////////
// Routes
////////////

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


////////////
// Auth Starts
////////////

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const userList = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
    const user = userList[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, email, name, role, adminPasscode } = req.body;
    
    // Validation
    if (!username || !password || !email || !name) {
      return res.status(400).json({ error: 'Username, password, email, and name are required' });
    }
    
    // Role validation - only allow admin and clinician
    const allowedRoles = ['admin', 'clinician'];
    if (role && !allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid role. Only admin and clinician roles are allowed' });
    }
    
    // Admin passcode validation
    if (role && role.toLowerCase() === 'admin') {
      if (!adminPasscode) {
        return res.status(400).json({ error: 'Admin passcode is required for administrator accounts' });
      }
      if (adminPasscode !== '000000') {
        return res.status(400).json({ error: 'Invalid admin passcode' });
      }
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    // Check if user already exists (case insensitive)
    const existingUsers = await db.select().from(users).where(
      eq(users.username, username.toLowerCase())
    );
    
    const existingEmails = await db.select().from(users).where(
      eq(users.email, email)
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    if (existingEmails.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: generateId(),
      username: username.toLowerCase(),
      password: hashedPassword,
      email,
      name,
      role: role ? role.toLowerCase() : 'clinician', // Default role
      createdAt: new Date().toISOString()
    };
    
    // Insert user
    await db.insert(users).values(newUser);
    
    // Generate token for immediate login
    const token = jwt.sign(
      { 
        id: newUser.id, 
        username: newUser.username, 
        role: newUser.role,
        name: newUser.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      token,
      user: userWithoutPassword,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const userList = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const user = userList[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

////////////
// Auth Ends
////////////

////////////
// CRUD Operations Start
////////////

// Get all data
app.get('/api/data', requireAuth, async (req, res) => {
  try {
    const data = await buildHierarchicalData();
    res.json(data);
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Get items by type
app.get('/api/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type === 'notes') {
      const allNotes = await db.select().from(notes);
      return res.json(allNotes);
    }
    
    // Convert plural to singular for database lookup
    const singularType = type.slice(0, -1); // Remove 's'
    const items = await getNodesByType(singularType);
    
    // Add parentId for compatibility
    const itemsWithParent = await Promise.all(
      items.map(async (item) => {
        const parent = await getParent(item.id);
        return {
          ...item,
          parentId: parent ? parent.id : null
        };
      })
    );
    
    res.json(itemsWithParent);
  } catch (error) {
    console.error(`Get ${req.params.type} error:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.type}` });
  }
});

// Get item by ID
app.get('/api/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (type === 'notes') {
      const noteList = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
      const note = noteList[0];
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      return res.json(note);
    }
    
    const item = await getNodeById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Add parentId for compatibility
    const parent = await getParent(item.id);
    const itemWithParent = {
      ...item,
      parentId: parent ? parent.id : null
    };
    
    res.json(itemWithParent);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new note (must come before the generic :type route)
app.post('/api/notes', requireAuth, async (req, res) => {
  try {
    const { content, attachedToId, attachedToType, tags = [] } = req.body;
    
    if (!content || !attachedToId || !attachedToType) {
      return res.status(400).json({ error: 'Content, attachedToId, and attachedToType are required' });
    }
    
    const newNote = {
      id: generateId(),
      content,
      attachedToId,
      attachedToType,
      tags: JSON.stringify(tags),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.insert(notes).values(newNote);
    
    // Return note with parsed tags
    const responseNote = {
      ...newNote,
      tags: tags
    };
    
    res.status(201).json(responseNote);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Create new item
app.post('/api/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Convert plural to singular for database
    const singularType = type.slice(0, -1); // Remove 's'
    
    // Check if user is trying to create an organization
    if (singularType === 'organisation' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create organizations' });
    }
    
    const newItem = await createHierarchyNode(singularType, name, parentId);
    
    res.status(201).json({
      ...newItem,
      type: singularType
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update note
app.put('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, tags = [] } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const updatedNote = await db.update(notes)
      .set({ 
        content, 
        tags: JSON.stringify(tags),
        updatedAt: new Date().toISOString() 
      })
      .where(eq(notes.id, id))
      .returning();
    
    if (updatedNote.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Return note with parsed tags
    const responseNote = {
      ...updatedNote[0],
      tags: tags
    };
    
    res.json(responseNote);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedNote = await db.delete(notes)
      .where(eq(notes.id, id))
      .returning();
    
    if (deletedNote.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get notes for a specific item
app.get('/api/notes/:attachedToType/:attachedToId', requireAuth, async (req, res) => {
  try {
    const { attachedToType, attachedToId } = req.params;
    
    const itemNotes = await db.select().from(notes).where(
      and(
        eq(notes.attachedToId, attachedToId),
        eq(notes.attachedToType, attachedToType)
      )
    );
    
    // Parse tags for each note
    const notesWithParsedTags = itemNotes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }));
    
    res.json(notesWithParsedTags);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Update hierarchy item
app.put('/api/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const updatedItem = await updateNode(id, name);
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Add parentId for compatibility
    const parent = await getParent(updatedItem.id);
    const itemWithParent = {
      ...updatedItem,
      parentId: parent ? parent.id : null
    };
    
    res.json(itemWithParent);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete hierarchy item (with cascading delete)
app.delete('/api/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    
    // Check if item exists
    const item = await getNodeById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Convert plural to singular for type checking
    const singularType = type.slice(0, -1); // Remove 's'
    
    // Check if user is trying to delete an organization
    if (singularType === 'organisation' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete organizations' });
    }
    
    // Delete the node and all its descendants
    const deletedCount = await deleteNodeAndDescendants(id);
    
    res.json({ 
      message: 'Item and all children deleted successfully',
      deletedCount 
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Catch-all handler for SPA in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

////////////
// CRUD Operations END
////////////



////////////
// AI Summary Starts
////////////

// Generate AI summary using Claude
async function generateClaudeAISummary(notes) {
  try {
    // Prepare notes data for Claude
    const notesText = notes.map((note, index) => 
      `Note ${index + 1} (${new Date(note.createdAt).toLocaleDateString()}):\n${note.content}`
    ).join('\n\n');

    const prompt = `You are a healthcare AI assistant analyzing th notes and please provide a 
        comprehensive summary of the following notes:
    ${notesText}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude AI error:', error);
    throw new Error(`Claude AI failed: ${error.message}`);
  }
}

// AI Summary endpoint
app.post('/api/ai/summarize', requireAuth, async (req, res) => {
  try {
    const { notes } = req.body;
    
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'Notes array is required' });
    }

    // Generate AI summary using Claude
    const summary = await generateClaudeAISummary(notes);
    
    res.json({ summary });
  } catch (error) {
    console.error('AI Summary error:', error);
    res.status(500).json({ error: 'Failed to generate AI summary' });
  }
});

////////////
// AI Summary Ends
////////////

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sever is running with Drizzle ORM with SQLite database`);
});
