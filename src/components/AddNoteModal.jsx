import { createSignal, For } from 'solid-js';
import Modal from './Modal';

function AddNoteModal(props) {
  const [content, setContent] = createSignal('');
  const [tags, setTags] = createSignal([]);
  const [newTag, setNewTag] = createSignal('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content().trim()) {
      props.onSubmit(content().trim(), tags());
      setContent('');
      setTags([]);
      setNewTag('');
    }
  };

  const handleClose = () => {
    setContent('');
    setTags([]);
    setNewTag('');
    props.onClose();
  };
  
  const addTag = () => {
    const tag = newTag().trim();
    if (tag && !tags().includes(tag)) {
      setTags([...tags(), tag]);
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    setTags(tags().filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  

  const getAttachedTypeLabel = (type) => {
    const labels = {
      organisation: 'Organization',
      team: 'Team',
      client: 'Client',
      episode: 'Episode'
    };
    return labels[type] || type;
  };

  const getAttachedTypeIcon = (type) => {
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
      title="Add Note"
    >
      <form onSubmit={handleSubmit}>
        <div class="text-center mb-4">
          <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
               style="width: 4rem; height: 4rem; background-color: #dbeafe; color: #2563eb; font-size: 2rem;">
            <i class="fas fa-sticky-note"></i>
          </div>
          <h4 class="fw-semibold text-dark mb-2">Add New Note</h4>
          {props.attachedToName && (
            <div class="alert alert-info py-2 mb-0">
              <i class={getAttachedTypeIcon(props.attachedToType)} style="margin-right: 0.5rem;"></i>
              Attaching to: <strong>{props.attachedToName}</strong> ({getAttachedTypeLabel(props.attachedToType)})
            </div>
          )}
        </div>
        
        <div class="mb-4">
          <label class="form-label fw-medium">
            <i class="fas fa-edit me-2"></i>
            Note Content
          </label>
          <textarea
            class="form-control"
            value={content()}
            onInput={(e) => setContent(e.target.value)}
            placeholder="Enter your note here..."
            autofocus
            required
            rows="6"
            style="min-height: 150px; resize: vertical;"
          />
          <div class="form-text">
            <i class="fas fa-info-circle me-1"></i>
            This note will be attached to the selected {getAttachedTypeLabel(props.attachedToType).toLowerCase()}.
          </div>
        </div>
        
        <div class="mb-4">
          <label class="form-label fw-medium">
            <i class="fas fa-tags me-2"></i>
            Tags (Optional)
          </label>
          <div class="input-group mb-2">
            <input
              type="text"
              class="form-control"
              value={newTag()}
              onInput={(e) => setNewTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add a tag..."
            />
            <button 
              type="button" 
              class="btn btn-outline-primary"
              onClick={addTag}
              disabled={!newTag().trim()}
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <For each={tags()}>
              {(tag) => (
                <span class="badge bg-primary d-flex align-items-center gap-1">
                  {tag}
                  <button 
                    type="button" 
                    class="btn-close btn-close-white" 
                    style="font-size: 0.7em;"
                    onClick={() => removeTag(tag)}
                    aria-label="Remove tag"
                  ></button>
                </span>
              )}
            </For>
          </div>
          <div class="form-text">
            <i class="fas fa-info-circle me-1"></i>
            Press Enter or click + to add tags. Tags help organize and filter your notes.
          </div>
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
              <i class="fas fa-save me-2"></i>
              Save Note
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default AddNoteModal;
