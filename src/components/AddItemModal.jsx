import { createSignal } from 'solid-js';
import Modal from './Modal';

function AddItemModal(props) {
  const [name, setName] = createSignal('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('AddItemModal - Form submitted with name:', name());
    if (name().trim()) {
      console.log('AddItemModal - Calling onSubmit with:', name().trim());
      props.onSubmit(name().trim());
      setName('');
    } else {
      console.log('AddItemModal - Name is empty, not submitting');
    }
  };

  const handleClose = () => {
    setName('');
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
      title={`Add ${getTypeLabel(props.type)}`}
    >
      <form onSubmit={handleSubmit}>
        <div class="text-center mb-4">
          <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
               style="width: 4rem; height: 4rem; background-color: #dbeafe; color: #2563eb; font-size: 2rem;">
            <i class={getTypeIcon(props.type)}></i>
          </div>
          <h4 class="fw-semibold text-dark mb-2">Create New {getTypeLabel(props.type)}</h4>
          {props.parentName && (
            <div class="alert alert-info py-2 mb-0">
              <i class="fas fa-arrow-right me-2"></i>
              Under: <strong>{props.parentName}</strong>
            </div>
          )}
        </div>
        
        <div class="mb-4">
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
        
        <div class="modal-footer border-top pt-3">
          <div class="d-flex gap-2 justify-content-end">
            <button 
              type="button" 
              class="btn btn-outline-secondary"
              onClick={handleClose}
            >
              <i class="fas fa-times me-2"></i>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-plus me-2"></i>
              Create {getTypeLabel(props.type)}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default AddItemModal;
