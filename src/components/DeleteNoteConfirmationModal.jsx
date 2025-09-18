import Modal from './Modal';

function DeleteNoteConfirmationModal(props) {
  const handleConfirm = () => {
    props.onConfirm();
  };

  const handleCancel = () => {
    props.onCancel();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleCancel}
      title="Delete Note"
    >
      <div class="modal-form-content">
        <div class="form-icon-header">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
          <h3 style="margin-bottom: 0.5rem; color: #dc2626;">Delete Note?</h3>
          <p class="text-sm text-gray-600" style="margin-bottom: 1.5rem;">
            This action cannot be undone.
          </p>
        </div>
        
        {props.note && (
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
              <i class="fas fa-sticky-note" style="color: #dc2626; font-size: 1.25rem; margin-top: 0.25rem;"></i>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #7f1d1d; margin-bottom: 0.5rem;">Note Content:</div>
                <div style="font-size: 0.875rem; color: #991b1b; background: white; padding: 0.75rem; border-radius: 0.375rem; border: 1px solid #fecaca; white-space: pre-wrap;">
                  {truncateContent(props.note.content)}
                </div>
              </div>
            </div>
            
            <div style="font-size: 0.75rem; color: #7f1d1d; border-top: 1px solid #fecaca; padding-top: 0.75rem;">
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
          </div>
        )}
        
        <div style="font-size: 0.875rem; color: #7f1d1d; text-align: center;">
          <p style="margin: 0;">
            <i class="fas fa-warning" style="margin-right: 0.5rem;"></i>
            <strong>Warning:</strong> This note will be permanently deleted and cannot be recovered.
          </p>
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
          Delete Note
        </button>
      </div>
    </Modal>
  );
}

export default DeleteNoteConfirmationModal;
