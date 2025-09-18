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
      <div class="modal-form-content">
        <div class="form-icon-header">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
          <h3 style="margin-bottom: 0.5rem; color: #dc2626;">Delete {getTypeLabel(props.type)}?</h3>
          <p class="text-sm text-gray-600" style="margin-bottom: 1.5rem;">
            This action cannot be undone.
          </p>
        </div>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
            <i class={getTypeIcon(props.type)} style="color: #dc2626; font-size: 1.25rem;"></i>
            <div>
              <div style="font-weight: 600; color: #7f1d1d;">{props.itemName}</div>
              <div style="font-size: 0.875rem; color: #991b1b;">{getTypeLabel(props.type)}</div>
            </div>
          </div>
          
          <div style="font-size: 0.875rem; color: #7f1d1d;">
            <p style="margin: 0;">
              <i class="fas fa-warning" style="margin-right: 0.5rem;"></i>
              <strong>Warning:</strong> This will permanently delete:
            </p>
            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
              <li>The {getTypeLabel(props.type).toLowerCase()} "{props.itemName}"</li>
              <li>All child items (if any)</li>
              <li>All associated notes</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button 
          type="button" 
          class="btn btn-secondary"
          onClick={handleCancel}
        >
          <i class="fas fa-times" style="margin-right: 0.5rem;"></i>
          Cancel
        </button>
        <button 
          type="button" 
          class="btn"
          onClick={handleConfirm}
          style="background: #dc2626; color: white;"
          onMouseOver={(e) => e.target.style.background = '#b91c1c'}
          onMouseOut={(e) => e.target.style.background = '#dc2626'}
        >
          <i class="fas fa-trash" style="margin-right: 0.5rem;"></i>
          Delete {getTypeLabel(props.type)}
        </button>
      </div>
    </Modal>
  );
}

export default DeleteConfirmationModal;
