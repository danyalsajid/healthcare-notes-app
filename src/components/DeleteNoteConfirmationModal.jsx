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
      <div class="modal-body">
        <div class="text-center mb-4">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
          <h4 class="mb-2 text-danger">Delete Note?</h4>
          <p class="text-muted small mb-0">
            This action cannot be undone.
          </p>
        </div>
        
        {props.note && (
          <div class="alert alert-danger border-danger mb-4">
            <div class="d-flex align-items-start mb-3">
              <i class="fas fa-sticky-note me-3 mt-1" style="color: #dc2626; font-size: 1.25rem;"></i>
              <div class="flex-grow-1">
                <div class="fw-bold text-danger mb-2">Note Content:</div>
                <div class="small text-danger-emphasis bg-white p-3 rounded border border-danger-subtle" style="white-space: pre-wrap;">
                  {truncateContent(props.note.content)}
                </div>
              </div>
            </div>
            
            <div class="small text-danger-emphasis border-top border-danger-subtle pt-3">
              <div>
                <i class="fas fa-calendar me-2"></i>
                Created: {formatDate(props.note.createdAt)}
              </div>
              {props.note.updatedAt !== props.note.createdAt && (
                <div class="mt-1">
                  <i class="fas fa-clock me-2"></i>
                  Last updated: {formatDate(props.note.updatedAt)}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div class="text-center small text-danger-emphasis">
          <p class="mb-0">
            <i class="fas fa-warning me-2"></i>
            <strong>Warning:</strong> This note will be permanently deleted and cannot be recovered.
          </p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onClick={handleCancel}>
          <i class="fas fa-times me-2"></i>
          Cancel
        </button>
        <button type="button" class="btn btn-danger" onClick={handleConfirm}>
          <i class="fas fa-trash me-2"></i>
          Delete Note
        </button>
      </div>
    </Modal>
  );
}

export default DeleteNoteConfirmationModal;
