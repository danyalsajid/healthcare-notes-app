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
        class="modal fade show d-block"
        style="background-color: rgba(0, 0, 0, 0.5); z-index: 9999;"
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        tabIndex="-1"
        ref={modalRef}
      >
        <div class="modal-dialog modal-dialog-centered" role="dialog" aria-modal="true">
          <div class="modal-content shadow-lg">
            <div class="modal-header border-bottom">
              <h5 class="modal-title fw-semibold text-dark">{props.title}</h5>
              <button 
                type="button"
                class="btn-close"
                onClick={props.onClose}
                aria-label="Close modal"
              ></button>
            </div>
            <div class="modal-body">
              {props.children}
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}

export default Modal;
