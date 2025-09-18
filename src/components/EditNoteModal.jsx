import { createSignal } from 'solid-js';
import Modal from './Modal';

function EditNoteModal(props) {
  const [content, setContent] = createSignal(props.currentContent || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content().trim()) {
      props.onSubmit(content().trim());
      setContent('');
    }
  };

  const handleClose = () => {
    setContent(props.currentContent || '');
    props.onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Edit Note"
    >
      <form onSubmit={handleSubmit}>
        <div class="modal-form-content">
          <div class="form-icon-header">
            <i class="fas fa-edit" style="font-size: 2rem; color: #2563eb; margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem;">Edit Note</h3>
            {props.note && (
              <div class="text-sm text-gray-600" style="margin-bottom: 1.5rem;">
                <div>
                  <i class="fas fa-calendar" style="margin-right: 0.5rem;"></i>
                  Created: {formatDate(props.note.createdAt)}
                </div>
                {props.note.updatedAt !== props.note.createdAt && (
                  <div style="margin-top: 0.25rem;">
                    <i class="fas fa-clock" style="margin-right: 0.5rem;"></i>
                    Last updated: {formatDate(props.note.updatedAt)}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-sticky-note" style="margin-right: 0.5rem;"></i>
              Note Content
            </label>
            <textarea
              class="form-input form-textarea"
              value={content()}
              onInput={(e) => setContent(e.target.value)}
              placeholder="Enter your note here..."
              autofocus
              required
              rows="6"
              style="min-height: 150px; resize: vertical;"
            />
            <div class="text-sm text-gray-500" style="margin-top: 0.5rem;">
              <i class="fas fa-info-circle" style="margin-right: 0.25rem;"></i>
              Make your changes and click "Save Changes" to update the note.
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save" style="margin-right: 0.5rem;"></i>
            Save Changes
          </button>
          <button 
            type="button" 
            class="btn btn-secondary"
            onClick={handleClose}
          >
            <i class="fas fa-times" style="margin-right: 0.5rem;"></i>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditNoteModal;
