import { Show, For, createSignal } from 'solid-js';
import { selectedItem, selectedType, getBreadcrumb, getNotesForItem, updateItem, deleteItem, setSelectedItem, setSelectedType } from '../store';
import Breadcrumb from './Breadcrumb';
import NotesList from './NotesList';
import AddNoteForm from './AddNoteForm';
import EditItemModal from './EditItemModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

function MainContent() {
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  
  const item = () => selectedItem();
  const type = () => selectedType();
  
  const breadcrumb = () => {
    const current = item();
    const currentType = type();
    if (!current || !currentType) return [];
    return getBreadcrumb(current.id, currentType);
  };

  const notes = () => {
    const current = item();
    const currentType = type();
    if (!current || !currentType) return [];
    return getNotesForItem(current.id, currentType);
  };

  const getTypeIcon = (itemType) => {
    const icons = {
      organisation: '🏥',
      team: '👥',
      client: '👤',
      episode: '📋'
    };
    return icons[itemType] || '📄';
  };

  const getTypeLabel = (itemType) => {
    const labels = {
      organisation: 'Organization',
      team: 'Team',
      client: 'Client',
      episode: 'Episode'
    };
    return labels[itemType] || itemType;
  };

  const handleEditItem = async (name) => {
    try {
      const currentItem = item();
      const currentType = type();
      const updatedItem = await updateItem(currentType, currentItem.id, name);
      setShowEditModal(false);
      
      // Update selection with the updated item
      setSelectedItem(updatedItem);
    } catch (error) {
      console.error('Failed to edit item:', error);
    }
  };

  const handleDeleteItem = async () => {
    try {
      const currentItem = item();
      const currentType = type();
      await deleteItem(currentType, currentItem.id);
      // Clear selection after deletion
      setSelectedItem(null);
      setSelectedType(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const showDeleteConfirmation = () => {
    setShowDeleteModal(true);
  };

  const startEditing = () => {
    setShowEditModal(true);
  };

  return (
    <div>
      <Show when={breadcrumb().length > 0}>
        <Breadcrumb items={breadcrumb()} />
      </Show>

      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h2 class="card-title flex items-center gap-2">
              <span>{getTypeIcon(type())}</span>
              {item().name}
            </h2>
            <p class="text-sm text-gray-600">
              {getTypeLabel(type())} • Created {new Date(item().createdAt).toLocaleDateString()}
            </p>
          </div>
          <div class="flex gap-2" style="margin-left: auto;">
            <button
              class="btn btn-secondary btn-small"
              onClick={startEditing}
              title="Edit"
              style="padding: 0.5rem; display: flex; align-items: center; justify-content: center; min-width: 2rem; height: 2rem;"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              class="btn btn-secondary btn-small"
              onClick={showDeleteConfirmation}
              title="Delete"
              style="padding: 0.5rem; display: flex; align-items: center; justify-content: center; min-width: 2rem; height: 2rem; color: #dc2626;"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="mb-4">
          <h3 class="font-medium mb-2">Notes ({notes().length})</h3>
          <Show 
            when={notes().length > 0}
            fallback={
              <p class="text-gray-600 text-sm">
                No notes attached to this {getTypeLabel(type()).toLowerCase()} yet.
              </p>
            }
          >
            <NotesList notes={notes()} />
          </Show>
        </div>

        <AddNoteForm 
          attachedToId={item().id} 
          attachedToType={type()}
          attachedToName={item().name}
        />
      </div>

      <EditItemModal
        isOpen={showEditModal()}
        type={type()}
        currentName={item().name}
        onSubmit={handleEditItem}
        onClose={() => setShowEditModal(false)}
      />
      
      <DeleteConfirmationModal
        isOpen={showDeleteModal()}
        type={type()}
        itemName={item().name}
        onConfirm={handleDeleteItem}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

export default MainContent;
