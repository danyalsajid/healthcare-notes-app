import Modal from './Modal';

function DeleteConfirmationModal(props) {
  const handleConfirm = () => {
    props.onConfirm();
  };

  const handleCancel = () => {
    props.onCancel();
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
      onClose={handleCancel}
      title="Confirm Delete"
    >
      <div class="modal-body">
        <div class="text-center mb-4">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
          <h4 class="mb-2 text-danger">Delete {getTypeLabel(props.type)}?</h4>
          <p class="text-muted small mb-0">
            This action cannot be undone.
          </p>
        </div>
        
        <div class="alert alert-danger border-danger">
          <div class="d-flex align-items-center mb-3">
            <i class={`${getTypeIcon(props.type)} me-3`} style="color: #dc2626; font-size: 1.25rem;"></i>
            <div>
              <div class="fw-bold text-danger">{props.itemName}</div>
              <div class="small text-danger-emphasis">{getTypeLabel(props.type)}</div>
            </div>
          </div>
          
          <div class="small text-danger-emphasis">
            <p class="mb-2">
              <i class="fas fa-warning me-2"></i>
              <strong>Warning:</strong> This will permanently delete:
            </p>
            <ul class="mb-0 ps-4">
              <li>The {getTypeLabel(props.type).toLowerCase()} "{props.itemName}"</li>
              <li>All child items (if any)</li>
              <li>All associated notes</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onClick={handleCancel}>
          <i class="fas fa-times me-2"></i>
          Cancel
        </button>
        <button type="button" class="btn btn-danger" onClick={handleConfirm}>
          <i class="fas fa-trash me-2"></i>
          Delete {getTypeLabel(props.type)}
        </button>
      </div>
    </Modal>
  );
}

export default DeleteConfirmationModal;
