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
        <div class="modal-form-content">
          <div class="form-icon-header">
            <i class={getTypeIcon(props.type)} style="font-size: 2rem; color: #2563eb; margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem;">Create New {getTypeLabel(props.type)}</h3>
            {props.parentName && (
              <p class="text-sm text-gray-600" style="margin-bottom: 1.5rem;">
                <i class="fas fa-arrow-right" style="margin: 0 0.5rem;"></i>
                Under: <strong>{props.parentName}</strong>
              </p>
            )}
          </div>
          
          <div class="form-group">
            <label class="form-label">
              <i class="fas fa-tag" style="margin-right: 0.5rem;"></i>
              Name
            </label>
            <input
              type="text"
              class="form-input"
              value={name()}
              onInput={(e) => setName(e.target.value)}
              placeholder={`Enter ${getTypeLabel(props.type).toLowerCase()} name`}
              autofocus
              required
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-plus" style="margin-right: 0.5rem;"></i>
            Create {getTypeLabel(props.type)}
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

export default AddItemModal;
