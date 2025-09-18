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
        <div class="modal-form-content">
          <div class="form-icon-header">
            <i class={getTypeIcon(props.type)} style="font-size: 2rem; color: #2563eb; margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem;">Edit {getTypeLabel(props.type)}</h3>
            <p class="text-sm text-gray-600" style="margin-bottom: 1.5rem;">
              <i class="fas fa-edit" style="margin-right: 0.5rem;"></i>
              Update the name for this {getTypeLabel(props.type).toLowerCase()}
            </p>
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

export default EditItemModal;
