import { createSignal, createEffect } from 'solid-js';
import { addNote } from '../store';
import AddNoteModal from './AddNoteModal';

function AddNoteForm(props) {
  const [showAddModal, setShowAddModal] = createSignal(false);

  // Close the modal when switching to a different item
  createEffect(() => {
    // Watch for changes in attachedToId (when user switches episodes/items)
    props.attachedToId;
    // Reset the form state when the attached item changes
    setShowAddModal(false);
  });

  const handleSubmit = async (content, tags = []) => {
    try {
      await addNote(content, props.attachedToId, props.attachedToType, tags);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add note:', error);
      // You could show an error message to the user here
    }
  };

  const handleClose = () => {
    setShowAddModal(false);
  };

  return (
    <div class="border-top pt-3">
      <button
        class="btn btn-primary d-flex align-items-center"
        onClick={() => setShowAddModal(true)}
      >
        <i class="fas fa-plus me-2"></i>
        Add Note
      </button>

      <AddNoteModal
        isOpen={showAddModal()}
        attachedToName={props.attachedToName}
        attachedToType={props.attachedToType}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    </div>
  );
}

export default AddNoteForm;
