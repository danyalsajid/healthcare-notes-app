import { createSignal, createMemo } from 'solid-js';
import { authApiCall } from './auth';

// API base URL
const API_BASE = 'http://localhost:3001/api';

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
  return data().notes.filter(note => 
    note.attachedToId === itemId && note.attachedToType === itemType
  );
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

export const addNote = async (content, attachedToId, attachedToType) => {
  try {
    setLoading(true);
    const newNote = await apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify({ content, attachedToId, attachedToType })
    });
    
    // Update local state
    const currentData = data();
    setData({
      ...currentData,
      notes: [...currentData.notes, newNote]
    });
    
    return newNote;
  } catch (err) {
    console.error('Failed to add note:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

export const updateNote = async (noteId, content) => {
  try {
    setLoading(true);
    const updatedNote = await apiCall(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
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
export { data, selectedItem, setSelectedItem, selectedType, setSelectedType, loading, error, loadData };
