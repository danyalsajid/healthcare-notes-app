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

  const handleSubmit = async (content) => {
    try {
      await addNote(content, props.attachedToId, props.attachedToType);
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
    <div>
      <button
        class="btn btn-primary"
        onClick={() => setShowAddModal(true)}
      >
        <i class="fas fa-plus" style="margin-right: 0.5rem;"></i>
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
