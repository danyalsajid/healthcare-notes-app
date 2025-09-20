# Healthcare Notes App - Technical Specifications

## Implementation Details & Code Examples

### Database Implementation

#### Closure Table Pattern
The app uses a closure table pattern for efficient hierarchical queries:

```sql
-- Example: Adding a new client under a team
INSERT INTO hierarchy_nodes (id, type, name) VALUES ('client-1', 'client', 'John Doe');
INSERT INTO hierarchy_closure (ancestor, descendant, depth) VALUES 
  ('client-1', 'client-1', 0),  -- Self reference
  ('org-1', 'client-1', 2),     -- Organization ancestor
  ('team-1', 'client-1', 1);    -- Team parent
```

#### Key Database Functions (hierarchy-utils.js)
```javascript
// Create node with all ancestor relationships
export async function createHierarchyNode(type, name, parentId = null) {
  return db.transaction((tx) => {
    // Insert node
    tx.insert(hierarchyNodes).values({ id, type, name }).run();
    
    // Insert self-reference
    tx.insert(hierarchyClosure).values({ ancestor: id, descendant: id, depth: 0 }).run();
    
    // Insert ancestor relationships if parent exists
    if (parentId) {
      const ancestors = tx.select().from(hierarchyClosure).where(eq(hierarchyClosure.descendant, parentId));
      for (const ancestor of ancestors.all()) {
        tx.insert(hierarchyClosure).values({
          ancestor: ancestor.ancestor,
          descendant: id,
          depth: ancestor.depth + 1
        }).run();
      }
    }
  });
}
```

### Authentication Flow

#### JWT Token Management
```javascript
// Login process (auth.js)
const login = async (username, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  // Store authentication data
  localStorage.setItem('healthcare_token', data.token);
  localStorage.setItem('healthcare_user', JSON.stringify(data.user));
  
  setToken(data.token);
  setUser(data.user);
  setIsAuthenticated(true);
};

// Authenticated API calls
const authApiCall = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token()}`,
    ...options.headers
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (response.status === 401) {
    logout(); // Auto-logout on token expiry
    throw new Error('Authentication required');
  }
  
  return response.json();
};
```

### State Management Patterns

#### Reactive State with SolidJS
```javascript
// Global state management (store.js)
const [data, setData] = createSignal({
  organisations: [],
  teams: [],
  clients: [],
  episodes: [],
  notes: []
});

// Computed values using createMemo
const hierarchyTree = createMemo(() => {
  const orgs = data().organisations;
  return orgs.map(org => ({
    ...org,
    children: getChildItems(org.id, 'team').map(team => ({
      ...team,
      children: getChildItems(team.id, 'client').map(client => ({
        ...client,
        children: getChildItems(client.id, 'episode')
      }))
    }))
  }));
});

// CRUD operations with optimistic updates
export const addNote = async (content, attachedToId, attachedToType, tags = []) => {
  const optimisticNote = {
    id: `temp-${Date.now()}`,
    content,
    attachedToId,
    attachedToType,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Optimistic update
  setData(prev => ({
    ...prev,
    notes: [...prev.notes, optimisticNote]
  }));
  
  try {
    const newNote = await apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify({ content, attachedToId, attachedToType, tags })
    });
    
    // Replace optimistic note with real note
    setData(prev => ({
      ...prev,
      notes: prev.notes.map(note => 
        note.id === optimisticNote.id ? newNote : note
      )
    }));
    
    return newNote;
  } catch (error) {
    // Rollback optimistic update
    setData(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== optimisticNote.id)
    }));
    throw error;
  }
};
```

### Component Architecture

#### Modal Pattern Implementation
```javascript
// Base Modal Component (Modal.jsx)
function Modal(props) {
  return (
    <Show when={props.show}>
      <div class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{props.title}</h5>
              <button type="button" class="btn-close" onClick={props.onClose}></button>
            </div>
            <div class="modal-body">
              {props.children}
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}

// Specialized Modal Usage
function AddNoteModal(props) {
  const [content, setContent] = createSignal('');
  const [selectedTags, setSelectedTags] = createSignal([]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await props.onAdd(content(), selectedTags());
    setContent('');
    setSelectedTags([]);
  };
  
  return (
    <Modal show={props.show} onClose={props.onClose} title="Add Note">
      <form onSubmit={handleSubmit}>
        <div class="mb-3">
          <label class="form-label">Note Content</label>
          <textarea 
            class="form-control" 
            value={content()} 
            onInput={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <TagSelector 
          selectedTags={selectedTags()} 
          onTagsChange={setSelectedTags} 
        />
        <button type="submit" class="btn btn-primary">Add Note</button>
      </form>
    </Modal>
  );
}
```

### Search Implementation

#### Real-time Search with Debouncing
```javascript
// Search functionality (SearchBar.jsx)
function SearchBar() {
  const [localQuery, setLocalQuery] = createSignal('');
  const [showResults, setShowResults] = createSignal(false);
  
  // Debounced search to avoid excessive API calls
  const debouncedSearch = debounce((query) => {
    setSearchQuery(query);
    setShowResults(query.trim().length > 0);
  }, 300);
  
  const handleInput = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedSearch(value);
  };
  
  const searchResults = createMemo(() => {
    if (!searchQuery().trim() && selectedTags().length === 0) return [];
    
    return searchAllNotes().map(note => {
      const item = getItemById(note.attachedToId, note.attachedToType);
      const breadcrumb = getBreadcrumb(note.attachedToId, note.attachedToType);
      
      return {
        ...note,
        item,
        breadcrumb,
        highlightedContent: highlightSearchTerm(note.content, searchQuery())
      };
    });
  });
  
  return (
    <div class="search-container position-relative">
      <input 
        type="text" 
        class="form-control" 
        placeholder="Search notes..." 
        value={localQuery()}
        onInput={handleInput}
      />
      
      <Show when={showResults()}>
        <div class="search-results position-absolute">
          <For each={searchResults()}>
            {(result) => (
              <SearchResultItem 
                result={result} 
                onClick={() => handleResultClick(result)}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

// Utility function for search term highlighting
function highlightSearchTerm(text, term) {
  if (!term.trim()) return text;
  
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

### Tag System Implementation

#### Tag Management
```javascript
// Predefined tags with colors
const PREDEFINED_TAGS = [
  { id: 'urgent', name: 'Urgent', color: '#dc3545', icon: 'fas fa-exclamation-triangle' },
  { id: 'follow-up', name: 'Follow-up', color: '#fd7e14', icon: 'fas fa-clock' },
  { id: 'medication', name: 'Medication', color: '#6f42c1', icon: 'fas fa-pills' },
  { id: 'assessment', name: 'Assessment', color: '#0d6efd', icon: 'fas fa-clipboard-check' }
];

// Tag selector component
function TagSelector(props) {
  const toggleTag = (tagId) => {
    const current = props.selectedTags || [];
    const updated = current.includes(tagId)
      ? current.filter(t => t !== tagId)
      : [...current, tagId];
    props.onTagsChange(updated);
  };
  
  return (
    <div class="tag-selector mb-3">
      <label class="form-label">Tags</label>
      <div class="d-flex flex-wrap gap-2">
        <For each={PREDEFINED_TAGS}>
          {(tag) => (
            <button
              type="button"
              class={`btn btn-sm ${
                (props.selectedTags || []).includes(tag.id) 
                  ? 'btn-primary' 
                  : 'btn-outline-secondary'
              }`}
              style={{
                '--bs-btn-color': tag.color,
                '--bs-btn-border-color': tag.color,
                '--bs-btn-hover-bg': tag.color,
                '--bs-btn-active-bg': tag.color
              }}
              onClick={() => toggleTag(tag.id)}
            >
              <i class={tag.icon}></i> {tag.name}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

// Tag display component
function TagBadge(props) {
  const tag = PREDEFINED_TAGS.find(t => t.id === props.tagId);
  if (!tag) return null;
  
  return (
    <span 
      class="badge me-1" 
      style={{ 'background-color': tag.color }}
    >
      <i class={tag.icon}></i> {tag.name}
    </span>
  );
}
```

### Error Handling Patterns

#### Comprehensive Error Management
```javascript
// Global error handler (store.js)
const [error, setError] = createSignal(null);
const [loading, setLoading] = createSignal(false);

const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('Authentication')) {
    // Redirect to login
    logout();
    return;
  }
  
  if (error.message.includes('Network')) {
    setError('Network error. Please check your connection.');
    return;
  }
  
  setError(error.message || 'An unexpected error occurred.');
  
  // Auto-clear error after 5 seconds
  setTimeout(() => setError(null), 5000);
};

// API wrapper with error handling
const apiCall = async (endpoint, options = {}) => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await authApiCall(endpoint, options);
    return response;
  } catch (err) {
    handleApiError(err);
    throw err;
  } finally {
    setLoading(false);
  }
};

// Component error boundaries
function ErrorBoundary(props) {
  const [error, setError] = createSignal(null);
  
  const handleError = (err) => {
    console.error('Component Error:', err);
    setError(err);
  };
  
  return (
    <Show 
      when={!error()} 
      fallback={
        <div class="alert alert-danger">
          <h5>Something went wrong</h5>
          <p>{error()?.message || 'An unexpected error occurred'}</p>
          <button 
            class="btn btn-outline-danger" 
            onClick={() => setError(null)}
          >
            Try Again
          </button>
        </div>
      }
    >
      <ErrorProvider onError={handleError}>
        {props.children}
      </ErrorProvider>
    </Show>
  );
}
```

### Performance Optimizations

#### Efficient Rendering Patterns
```javascript
// Virtualized list for large datasets
function VirtualizedNotesList(props) {
  const [visibleRange, setVisibleRange] = createSignal({ start: 0, end: 50 });
  
  const visibleNotes = createMemo(() => {
    const range = visibleRange();
    return props.notes.slice(range.start, range.end);
  });
  
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    const itemHeight = 100; // Approximate note height
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(clientHeight / itemHeight) + 5, // Buffer
      props.notes.length
    );
    
    setVisibleRange({ start, end });
  };
  
  return (
    <div class="notes-container" onScroll={handleScroll}>
      <div style={{ height: `${props.notes.length * 100}px` }}>
        <div style={{ transform: `translateY(${visibleRange().start * 100}px)` }}>
          <For each={visibleNotes()}>
            {(note) => <NoteCard note={note} />}
          </For>
        </div>
      </div>
    </div>
  );
}

// Memoized expensive computations
const hierarchyStats = createMemo(() => {
  const data = getData();
  return {
    totalOrganisations: data.organisations.length,
    totalTeams: data.teams.length,
    totalClients: data.clients.length,
    totalEpisodes: data.episodes.length,
    totalNotes: data.notes.length,
    notesByType: data.notes.reduce((acc, note) => {
      acc[note.attachedToType] = (acc[note.attachedToType] || 0) + 1;
      return acc;
    }, {})
  };
});
```

### Testing Strategies

#### Unit Testing Examples
```javascript
// Test authentication functions
describe('Authentication', () => {
  test('login stores token and user data', async () => {
    const mockResponse = {
      token: 'mock-jwt-token',
      user: { id: '1', username: 'test', name: 'Test User' }
    };
    
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );
    
    await login('test', 'password');
    
    expect(localStorage.getItem('healthcare_token')).toBe('mock-jwt-token');
    expect(isAuthenticated()).toBe(true);
  });
});

// Test hierarchy operations
describe('Hierarchy Management', () => {
  test('addItem creates item with correct parent relationship', async () => {
    const mockItem = { id: 'team-1', name: 'Cardiology', parentId: 'org-1' };
    
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockItem)
      })
    );
    
    const result = await addItem('team', 'Cardiology', 'org-1');
    
    expect(result.parentId).toBe('org-1');
    expect(result.name).toBe('Cardiology');
  });
});
```

This technical specification provides detailed implementation examples and patterns used throughout the Healthcare Notes App, complementing the main documentation with code-level details.
