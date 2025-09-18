import { createSignal } from 'solid-js';
import Modal from './Modal';

function AddNoteModal(props) {
  const [content, setContent] = createSignal('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content().trim()) {
      props.onSubmit(content().trim());
      setContent('');
    }
  };

  const handleClose = () => {
    setContent('');
    props.onClose();
  };

  const getAttachedTypeLabel = (type) => {
    const labels = {
      organisation: 'Organization',
      team: 'Team',
      client: 'Client',
      episode: 'Episode'
    };
    return labels[type] || type;
  };

  const getAttachedTypeIcon = (type) => {
    const icons = {
      organisation: 'fas fa-hospital',
      team: 'fas fa-users',
      client: 'fas fa-user',
      episode: 'fas fa-clipboard-list'
    };
    return icons[type] || 'fas fa-file';
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Add Note"
    >
      <form onSubmit={handleSubmit}>
        <div class="modal-form-content">
          <div class="form-icon-header">
            <i class="fas fa-sticky-note" style="font-size: 2rem; color: #2563eb; margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem;">Add New Note</h3>
            {props.attachedToName && (
              <p class="text-sm text-gray-600" style="margin-bottom: 1.5rem;">
                <i class={getAttachedTypeIcon(props.attachedToType)} style="margin-right: 0.5rem;"></i>
                Attaching to: <strong>{props.attachedToName}</strong> ({getAttachedTypeLabel(props.attachedToType)})
              </p>
            )}
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-edit" style="margin-right: 0.5rem;"></i>
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
              This note will be attached to the selected {getAttachedTypeLabel(props.attachedToType).toLowerCase()}.
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save" style="margin-right: 0.5rem;"></i>
            Save Note
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

export default AddNoteModal;
