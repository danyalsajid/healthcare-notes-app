import { createSignal, createMemo } from 'solid-js';
import { authApiCall } from './auth';

// API base URL - Dynamic based on current host and protocol
const getApiBase = () => {
  // Use the same protocol as the current page (HTTP or HTTPS)
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If running on localhost (development), use localhost with port 3001
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//localhost:3001/api`;
  }
  
  // If deployed (Railway, Netlify, etc.), API is on same domain without port
  if (hostname.includes('.railway.app') || hostname.includes('.netlify.app') || hostname.includes('.vercel.app')) {
    return `${protocol}//${hostname}/api`;
  }
  
  // For other network access (local network), use port 3001
  return `${protocol}//${hostname}:3001/api`;
};
const API_BASE = getApiBase();

// Global state
const [data, setData] = createSignal({
  organisations: [],
  teams: [],
  clients: [],
  episodes: [],
  notes: []
});
const [selectedItem, setSelectedItem] = createSignal(null);
const [selectedType, setSelectedType] = createSignal(null);
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal(null);

// Search state
const [searchQuery, setSearchQuery] = createSignal('');
const [searchResults, setSearchResults] = createSignal([]);
const [isSearching, setIsSearching] = createSignal(false);

// Tag filter state
const [selectedTags, setSelectedTags] = createSignal([]);
const [availableTags, setAvailableTags] = createSignal([]);

// API helper functions - now uses authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    setError(null);
    return await authApiCall(endpoint, options);
  } catch (err) {
    setError(err.message);
    throw err;
  }
};

// Load initial data from API
const loadData = async () => {
  try {
    setLoading(true);
    const apiData = await apiCall('/data');
    setData(apiData);
    // Update available tags after loading data
    updateAvailableTags();
  } catch (err) {
    console.error('Failed to load data:', err);
    // Don't set error for authentication issues
    if (!err.message.includes('Not authenticated') && !err.message.includes('Authentication required')) {
      setError(err.message);
    }
    // Fallback to empty data structure
    setData({
      organisations: [],
      teams: [],
      clients: [],
      episodes: [],
      notes: []
    });
  } finally {
    setLoading(false);
  }
};

// Data will be loaded when user is authenticated

// Helper functions
export const getItemsByType = (type) => data()[type + 's'] || [];

export const getItemById = (id, type) => {
  const items = getItemsByType(type);
  return items.find(item => item.id === id);
};

export const getChildItems = (parentId, childType) => {
  const items = getItemsByType(childType);
  return items.filter(item => item.parentId === parentId);
};

export const getNotesForItem = (itemId, itemType) => {
  let notes = data().notes.filter(note => 
    note.attachedToId === itemId && note.attachedToType === itemType
  );
  
  // Apply tag filter if any tags are selected
  const tags = selectedTags();
  if (tags.length > 0) {
    notes = notes.filter(note => {
      const noteTags = note.tags || [];
      return tags.some(tag => noteTags.includes(tag));
    });
  }
  
  return notes;
};

// Search functionality
export const searchAllNotes = (query) => {
  if (!query || query.trim() === '') {
    setSearchResults([]);
    setSearchQuery('');
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  setSearchQuery(query);
  setIsSearching(true);

  try {
    const allNotes = data().notes;
    const matchingNotes = allNotes.filter(note => 
      note.content.toLowerCase().includes(normalizedQuery)
    );

    // Enhance results with hierarchy information
    const enhancedResults = matchingNotes.map(note => {
      const attachedItem = getItemById(note.attachedToId, note.attachedToType);
      const breadcrumb = getBreadcrumb(note.attachedToId, note.attachedToType);
      
      return {
        ...note,
        attachedItem,
        breadcrumb,
        hierarchy: breadcrumb.map(b => b.name).join(' > ')
      };
    });

    setSearchResults(enhancedResults);
    return enhancedResults;
  } catch (err) {
    console.error('Search error:', err);
    setSearchResults([]);
    return [];
  } finally {
    setIsSearching(false);
  }
};

export const clearSearch = () => {
  setSearchQuery('');
  setSearchResults([]);
  setIsSearching(false);
};

// Tag filtering functions
export const updateAvailableTags = () => {
  const allNotes = data().notes;
  const tagSet = new Set();
  
  allNotes.forEach(note => {
    if (note.tags && Array.isArray(note.tags)) {
      note.tags.forEach(tag => tagSet.add(tag));
    }
  });
  
  setAvailableTags(Array.from(tagSet).sort());
};

export const toggleTagFilter = (tag) => {
  const currentTags = selectedTags();
  if (currentTags.includes(tag)) {
    setSelectedTags(currentTags.filter(t => t !== tag));
  } else {
    setSelectedTags([...currentTags, tag]);
  }
};

export const clearTagFilters = () => {
  setSelectedTags([]);
};

export const getAllNotesWithTags = () => {
  let notes = data().notes;
  
  // Apply tag filter if any tags are selected
  const tags = selectedTags();
  if (tags.length > 0) {
    notes = notes.filter(note => {
      const noteTags = note.tags || [];
      return tags.some(tag => noteTags.includes(tag));
    });
  }
  
  return notes;
};

export const selectSearchResult = (note) => {
  // Navigate to the item that contains this note
  const item = getItemById(note.attachedToId, note.attachedToType);
  if (item) {
    setSelectedItem(item);
    setSelectedType(note.attachedToType);
    clearSearch();
  }
};

// AI Summary functionality
export const generateAISummary = async (notes) => {
  if (!notes || notes.length === 0) {
    throw new Error('No notes provided for summarization');
  }

  try {
    // Prepare notes data for AI analysis
    const notesData = notes.map(note => ({
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }));

    // Call the AI summary API endpoint
    const response = await apiCall('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ notes: notesData })
    });

    return response.summary;
  } catch (err) {
    console.error('AI Summary API error:', err);
    
    // Fallback to a simple client-side summary if API fails
    return generateFallbackSummary(notes);
  }
};

// Fallback summary generation (client-side)
const generateFallbackSummary = (notes) => {
  if (notes.length === 0) return 'No notes available.';
  
  const totalNotes = notes.length;
  const totalWords = notes.reduce((acc, note) => acc + note.content.split(' ').length, 0);
  const avgWordsPerNote = Math.round(totalWords / totalNotes);
  
  // Sort notes by creation date
  const sortedNotes = [...notes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const oldestNote = sortedNotes[0];
  const newestNote = sortedNotes[sortedNotes.length - 1];
  
  // Extract key themes (simple keyword frequency)
  const allText = notes.map(note => note.content.toLowerCase()).join(' ');
  const words = allText.split(/\W+/).filter(word => word.length > 3);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  const topWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return `📊 **Summary Overview**

` +
    `**Total Notes:** ${totalNotes}
` +
    `**Total Words:** ${totalWords} (avg ${avgWordsPerNote} per note)
` +
    `**Date Range:** ${new Date(oldestNote.createdAt).toLocaleDateString()} - ${new Date(newestNote.createdAt).toLocaleDateString()}

` +
    `**Key Topics:** ${topWords.join(', ')}

` +
    `**Recent Activity:**
` +
    `${notes.slice(-3).map(note => 
      `• ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''} (${new Date(note.createdAt).toLocaleDateString()})`
    ).join('\n')}

` +
    `*Note: This is a basic summary. For more detailed AI analysis, please ensure the AI service is properly configured.*`;
};


export const getBreadcrumb = (itemId, itemType) => {
  const breadcrumb = [];
  let currentId = itemId;
  let currentType = itemType;
  
  while (currentId) {
    const item = getItemById(currentId, currentType);
    if (!item) break;
    
    breadcrumb.unshift({ id: currentId, type: currentType, name: item.name });
    
    // Move to parent
    currentId = item.parentId;
    switch (currentType) {
      case 'episode': currentType = 'client'; break;
      case 'client': currentType = 'team'; break;
      case 'team': currentType = 'organisation'; break;
      default: currentId = null;
    }
  }
  
  return breadcrumb;
};

// CRUD operations
export const addItem = async (type, name, parentId = null) => {
  console.log('Store - addItem called with:', { type, name, parentId });
  try {
    setLoading(true);
    console.log('Store - Making API call to:', `/${type}s`);
    
    const newItem = await apiCall(`/${type}s`, {
      method: 'POST',
      body: JSON.stringify({ name, parentId })
    });
    
    console.log('Store - API call successful, response:', newItem);
    console.log('Store - Reloading data...');
    
    // Force reload all data to ensure consistency
    await loadData();
    
    console.log('Store - Data reloaded successfully');
    return newItem;
  } catch (err) {
    console.error('Store - Failed to add item:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

export const addNote = async (content, attachedToId, attachedToType, tags = []) => {
  try {
    setLoading(true);
    const newNote = await apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify({ content, attachedToId, attachedToType, tags })
    });
    
    // Update local state
    const currentData = data();
    setData({
      ...currentData,
      notes: [...currentData.notes, newNote]
    });
    
    // Update available tags
    updateAvailableTags();
    
    return newNote;
  } catch (err) {
    console.error('Failed to add note:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

export const updateNote = async (noteId, content, tags = []) => {
  try {
    setLoading(true);
    const updatedNote = await apiCall(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content, tags })
    });
    
    // Update local state
    const currentData = data();
    const updatedNotes = currentData.notes.map(note =>
      note.id === noteId ? updatedNote : note
    );
    
    setData({
      ...currentData,
      notes: updatedNotes
    });
    
    // Update available tags
    updateAvailableTags();
    
    return updatedNote;
  } catch (err) {
    console.error('Failed to update note:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

export const deleteNote = async (noteId) => {
  try {
    setLoading(true);
    await apiCall(`/notes/${noteId}`, {
      method: 'DELETE'
    });
    
    // Update local state
    const currentData = data();
    const filteredNotes = currentData.notes.filter(note => note.id !== noteId);
    
    setData({
      ...currentData,
      notes: filteredNotes
    });
  } catch (err) {
    console.error('Failed to delete note:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

export const updateItem = async (type, itemId, name) => {
  try {
    setLoading(true);
    const updatedItem = await apiCall(`/${type}s/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    
    // Update local state
    const currentData = data();
    const typeKey = type + 's';
    const updatedItems = currentData[typeKey].map(item =>
      item.id === itemId ? updatedItem : item
    );
    
    setData({
      ...currentData,
      [typeKey]: updatedItems
    });
    
    return updatedItem;
  } catch (err) {
    console.error('Failed to update item:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

export const deleteItem = async (type, itemId) => {
  try {
    setLoading(true);
    await apiCall(`/${type}s/${itemId}`, {
      method: 'DELETE'
    });
    
    // Reload all data to reflect cascading deletes
    await loadData();
    
    // Clear selection if the deleted item was selected
    if (selectedItem()?.id === itemId) {
      setSelectedItem(null);
      setSelectedType(null);
    }
  } catch (err) {
    console.error('Failed to delete item:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

// Computed values
export const hierarchyTree = createMemo(() => {
  const organisations = getItemsByType('organisation');
  
  return organisations.map(org => ({
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

// Export signals
export { 
  data, 
  selectedItem, 
  setSelectedItem, 
  selectedType, 
  setSelectedType, 
  loading, 
  error, 
  loadData,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  selectedTags,
  setSelectedTags,
  availableTags,
  setAvailableTags
};
