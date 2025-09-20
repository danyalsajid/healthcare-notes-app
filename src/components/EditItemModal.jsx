import { createSignal } from 'solid-js';
import Modal from './Modal';

function EditItemModal(props) {
  const [name, setName] = createSignal(props.currentName || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name().trim()) {
      props.onSubmit(name().trim());
      setName('');
    }
  };

  const handleClose = () => {
    setName(props.currentName || '');
    props.onClose();
  };

  const getTypeLabel = (type) => {
    const labels = {
      organisation: 'Organization',
      team: 'Team',
      client: 'Client',
      episode: 'Episode'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
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
      title={`Edit ${getTypeLabel(props.type)}`}
    >
      <form onSubmit={handleSubmit}>
        <div class="modal-body">
          <div class="text-center mb-4">
            <i class={getTypeIcon(props.type)} style="font-size: 2rem; color: #1e40af; margin-bottom: 1rem;"></i>
            <h4 class="mb-2">Edit {getTypeLabel(props.type)}</h4>
            <p class="text-muted small mb-0">
              <i class="fas fa-edit me-2"></i>
              Update the name for this {getTypeLabel(props.type).toLowerCase()}
            </p>
          </div>
          
          <div class="mb-3">
            <label class="form-label fw-medium">
              <i class="fas fa-tag me-2"></i>
              Name
            </label>
            <input
              type="text"
              class="form-control"
              value={name()}
              onInput={(e) => setName(e.target.value)}
              placeholder={`Enter ${getTypeLabel(props.type).toLowerCase()} name`}
              autofocus
              required
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onClick={handleClose}>
            <i class="fas fa-times me-2"></i>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save me-2"></i>
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditItemModal;
