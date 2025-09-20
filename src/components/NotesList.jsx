import { For, Show, createSignal } from 'solid-js';
import { updateNote, deleteNote } from '../store';
import EditNoteModal from './EditNoteModal';
import DeleteNoteConfirmationModal from './DeleteNoteConfirmationModal';

function NotesList(props) {
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [selectedNote, setSelectedNote] = createSignal(null);
  

  const startEditing = (note) => {
    setSelectedNote(note);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (content, tags = []) => {
    try {
      await updateNote(selectedNote().id, content, tags);
      setShowEditModal(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
      // You could show an error message to the user here
    }
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setSelectedNote(null);
  };

  const startDeleting = (note) => {
    setSelectedNote(note);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteNote(selectedNote().id);
      setShowDeleteModal(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
      // You could show an error message to the user here
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedNote(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  

  return (
    <div class="row g-3">
      <For each={props.notes}>
        {(note) => (
          <div class="col-12">
            <div class="card border-0 bg-light">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div class="text-muted small">
                    <i class="fas fa-clock me-1"></i>
                    Created: {formatDate(note.createdAt)}
                    {note.updatedAt !== note.createdAt && (
                      <span class="ms-2">
                        <i class="fas fa-edit me-1"></i>
                        Updated: {formatDate(note.updatedAt)}
                      </span>
                    )}
                  </div>
                  <div class="d-flex gap-1">
                    <button
                      class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
                      onClick={() => startEditing(note)}
                      title="Edit note"
                      style="width:2.5rem;height:2.5rem"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      class="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                      onClick={() => startDeleting(note)}
                      title="Delete note"
                      style="width:2.5rem;height:2.5rem;"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <div class="text-dark mb-2" style="white-space: pre-wrap; line-height: 1.5;">
                  {note.content}
                </div>
                
                <Show when={note.tags && note.tags.length > 0}>
                  <div class="d-flex flex-wrap gap-1 mt-2">
                    <For each={note.tags}>
                      {(tag) => (
                        <span class="badge bg-primary">
                          <i class="fas fa-tag me-1"></i>
                          {tag}
                        </span>
                      )}
                    </For>
                  </div>
                </Show>
                
              </div>
            </div>
          </div>
        )}
      </For>
      
      <EditNoteModal
        isOpen={showEditModal()}
        note={selectedNote()}
        currentContent={selectedNote()?.content}
        onSubmit={handleEditSubmit}
        onClose={handleEditClose}
      />
      
      <DeleteNoteConfirmationModal
        isOpen={showDeleteModal()}
        note={selectedNote()}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

export default NotesList;
