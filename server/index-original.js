import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'seed.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const JWT_SECRET = 'healthcare-notes-secret-key-2024';

// Middleware - Simplified CORS for development
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

// Helper function to read data from JSON file
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return {
      organisations: [],
      teams: [],
      clients: [],
      episodes: [],
      notes: []
    };
  }
};

// Helper function to write data to JSON file
const writeData = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
};

// Helper function to read users from JSON file
const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

// Helper function to write users to JSON file
const writeUsers = async (users) => {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
};

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

// Generate unique ID
const generateId = () => randomUUID();

// Routes

// Health check (public endpoint - must be first)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const users = await readUsers();
    const user = users.find(u => u.username === username);
    
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
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, email, name, role } = req.body;
    
    // Validation
    if (!username || !password || !email || !name) {
      return res.status(400).json({ error: 'Username, password, email, and name are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    const users = await readUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already exists' });
      } else {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: generateId(),
      username,
      password: hashedPassword,
      email,
      name,
      role: role || 'user', // Default role
      createdAt: new Date().toISOString()
    };
    
    // Add user to array
    users.push(newUser);
    
    // Save to file
    const success = await writeUsers(users);
    if (!success) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
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
    const users = await readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Get all data
app.get('/api/data', requireAuth, async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Get items by type
app.get('/api/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const data = await readData();
    const items = data[type] || [];
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch ${type}` });
  }
});

// Get item by ID
app.get('/api/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const data = await readData();
    const items = data[type] || [];
    const item = items.find(item => item.id === id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new note (must come before the generic :type route)
app.post('/api/notes', requireAuth, async (req, res) => {
  try {
    const { content, attachedToId, attachedToType } = req.body;
    
    if (!content || !attachedToId || !attachedToType) {
      return res.status(400).json({ error: 'Content, attachedToId, and attachedToType are required' });
    }
    
    const data = await readData();
    const newNote = {
      id: generateId(),
      content,
      attachedToId,
      attachedToType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!data.notes) {
      data.notes = [];
    }
    
    data.notes.push(newNote);
    
    const success = await writeData(data);
    if (success) {
      res.status(201).json(newNote);
    } else {
      res.status(500).json({ error: 'Failed to save note' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Create new item (must come after specific routes like /api/notes)
app.post('/api/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const data = await readData();
    const newItem = {
      id: generateId(),
      type: type.slice(0, -1), // Remove 's' from plural
      name,
      parentId: parentId || null,
      createdAt: new Date().toISOString()
    };
    
    if (!data[type]) {
      data[type] = [];
    }
    
    data[type].push(newItem);
    
    const success = await writeData(data);
    if (success) {
      res.status(201).json(newItem);
    } else {
      res.status(500).json({ error: 'Failed to save item' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update note
app.put('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const data = await readData();
    const noteIndex = data.notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    data.notes[noteIndex] = {
      ...data.notes[noteIndex],
      content,
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeData(data);
    if (success) {
      res.json(data.notes[noteIndex]);
    } else {
      res.status(500).json({ error: 'Failed to update note' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readData();
    const noteIndex = data.notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    data.notes.splice(noteIndex, 1);
    
    const success = await writeData(data);
    if (success) {
      res.json({ message: 'Note deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete note' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get notes for a specific item
app.get('/api/notes/:attachedToType/:attachedToId', requireAuth, async (req, res) => {
  try {
    const { attachedToType, attachedToId } = req.params;
    const data = await readData();
    const notes = data.notes.filter(note => 
      note.attachedToId === attachedToId && note.attachedToType === attachedToType
    );
    res.json(notes);
  } catch (error) {
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
    
    const data = await readData();
    const items = data[type] || [];
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    items[itemIndex] = {
      ...items[itemIndex],
      name,
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeData(data);
    if (success) {
      res.json(items[itemIndex]);
    } else {
      res.status(500).json({ error: 'Failed to update item' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete hierarchy item (with cascading delete)
app.delete('/api/:type/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const data = await readData();
    
    // Find the item to delete
    const items = data[type] || [];
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Cascading delete: remove all children and their notes
    const deleteItemAndChildren = (itemId, itemType) => {
      // Delete notes attached to this item
      data.notes = data.notes.filter(note => 
        !(note.attachedToId === itemId && note.attachedToType === itemType.slice(0, -1))
      );
      
      // Delete children based on hierarchy
      if (itemType === 'organisations') {
        // Delete teams under this organization
        const teamsToDelete = data.teams.filter(team => team.parentId === itemId);
        teamsToDelete.forEach(team => deleteItemAndChildren(team.id, 'teams'));
        data.teams = data.teams.filter(team => team.parentId !== itemId);
      } else if (itemType === 'teams') {
        // Delete clients under this team
        const clientsToDelete = data.clients.filter(client => client.parentId === itemId);
        clientsToDelete.forEach(client => deleteItemAndChildren(client.id, 'clients'));
        data.clients = data.clients.filter(client => client.parentId !== itemId);
      } else if (itemType === 'clients') {
        // Delete episodes under this client
        const episodesToDelete = data.episodes.filter(episode => episode.parentId === itemId);
        episodesToDelete.forEach(episode => deleteItemAndChildren(episode.id, 'episodes'));
        data.episodes = data.episodes.filter(episode => episode.parentId !== itemId);
      }
    };
    
    // Perform cascading delete
    deleteItemAndChildren(id, type);
    
    // Remove the item itself
    items.splice(itemIndex, 1);
    
    const success = await writeData(data);
    if (success) {
      res.json({ message: 'Item and all children deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Healthcare Notes API server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
