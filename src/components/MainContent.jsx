import { Show, For, createSignal } from 'solid-js';
import { selectedItem, selectedType, getBreadcrumb, getNotesForItem, updateItem, deleteItem, setSelectedItem, setSelectedType, generateAISummary } from '../store';
import { user } from '../auth';
import Breadcrumb from './Breadcrumb';
import NotesList from './NotesList';
import AddNoteForm from './AddNoteForm';
import EditItemModal from './EditItemModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import AISummaryModal from './AISummaryModal';

function MainContent() {
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [showAISummaryModal, setShowAISummaryModal] = createSignal(false);
  
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
      organisation: 'fas fa-hospital',
      team: 'fas fa-users',
      client: 'fas fa-user',
      episode: 'fas fa-clipboard-list'
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

  const showAISummary = () => {
    setShowAISummaryModal(true);
  };

  const handleGenerateAISummary = async (notes) => {
    return await generateAISummary(notes);
  };

  const canEditDeleteItem = () => {
    const currentType = type();
    const currentUser = user();
    
    // Only admins can edit and delete organizations
    if (currentType === 'organisation') {
      return currentUser?.role === 'admin';
    }
    
    // All authenticated users can edit and delete other types
    return true;
  };

  return (
    <div class="container-fluid p-4">
      <Show when={breadcrumb().length > 0}>
        <Breadcrumb items={breadcrumb()} />
      </Show>

      <div class="card shadow-sm border-0">
        <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-start">
          <div>
            <h2 class="card-title h4 fw-bold text-dark mb-2 d-flex align-items-center gap-2">
              <span style="font-size: 1.5rem;"><i class={getTypeIcon(type())}></i> </span>
              {item().name}
            </h2>
            <p class="text-muted small mb-0">
              <span class="badge bg-light text-dark me-2">{getTypeLabel(type())}</span>
              Created {new Date(item().createdAt).toLocaleDateString()}
            </p>
          </div>
          <div class="d-flex gap-2">
          <Show when={canEditDeleteItem()}>
            <button
              class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
              onClick={startEditing}
              title="Edit"
              style="width: 2.5rem; height: 2.5rem;"
            >
              <i class="fas fa-edit"></i>
            </button>
           
              <button
                class="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={showDeleteConfirmation}
                title="Delete"
                style="width: 2.5rem; height: 2.5rem;"
              >
                <i class="fas fa-trash"></i>
              </button>
            </Show>
          </div>
        </div>

        <div class="card-body">
          <div class="mb-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h3 class="h5 fw-medium text-dark mb-0">
                Notes 
                <span class="badge bg-primary ms-2">{notes().length}</span>
              </h3>
              <Show when={notes().length > 0}>
                <button
                  class="btn btn-primary btn-sm"
                  onClick={showAISummary}
                  title="Generate AI Summary"
                >
                  <i class="fas fa-magic me-2"></i>
                  AI Summary
                </button>
              </Show>
            </div>
            <Show 
              when={notes().length > 0}
              fallback={
                <div class="alert alert-light border-0 text-center py-4">
                  <i class="fas fa-sticky-note text-muted mb-2" style="font-size: 2rem;"></i>
                  <p class="text-muted mb-0">
                    No notes attached to this {getTypeLabel(type()).toLowerCase()} yet.
                  </p>
                </div>
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
      
      <AISummaryModal
        isOpen={showAISummaryModal()}
        notes={notes()}
        itemName={item().name}
        itemType={type()}
        onGenerateSummary={handleGenerateAISummary}
        onClose={() => setShowAISummaryModal(false)}
      />
    </div>
  );
}

export default MainContent;
