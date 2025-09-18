import { Show, createEffect } from 'solid-js';

function Modal(props) {
  let modalRef;

  createEffect(() => {
    if (props.isOpen) {
      // Focus the modal when it opens
      modalRef?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }
  });

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      props.onClose?.();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      props.onClose?.();
    }
  };

  return (
    <Show when={props.isOpen}>
      <div 
        class="modal-backdrop"
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        tabIndex="-1"
        ref={modalRef}
      >
        <div class="modal-content" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2 class="modal-title">{props.title}</h2>
            <button 
              class="modal-close-btn"
              onClick={props.onClose}
              aria-label="Close modal"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            {props.children}
          </div>
        </div>
      </div>
    </Show>
  );
}

export default Modal;
