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

  const handleEditSubmit = async (content) => {
    try {
      await updateNote(selectedNote().id, content);
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
    <div>
      <For each={props.notes}>
        {(note) => (
          <div class="note-item">
            <div class="note-header">
              <div class="note-meta">
                Created: {formatDate(note.createdAt)}
                {note.updatedAt !== note.createdAt && (
                  <span> • Updated: {formatDate(note.updatedAt)}</span>
                )}
              </div>
              <div class="flex gap-2">
                <button
                  class="btn btn-secondary btn-small"
                  onClick={() => startEditing(note)}
                  title="Edit note"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  class="btn btn-secondary btn-small"
                  onClick={() => startDeleting(note)}
                  style="color: #dc2626;"
                  title="Delete note"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="note-content">{note.content}</div>
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
