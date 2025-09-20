import { createSignal, createEffect, For } from 'solid-js';
import Modal from './Modal';

function EditNoteModal(props) {
  const [content, setContent] = createSignal(props.currentContent || '');
  const [tags, setTags] = createSignal([]);
  const [newTag, setNewTag] = createSignal('');
  
  // Update content and tags when note changes
  createEffect(() => {
    if (props.note) {
      setContent(props.note.content || '');
      setTags(props.note.tags || []);
    }
  });

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
    setContent(props.currentContent || '');
    setTags(props.note?.tags || []);
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
  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Edit Note"
    >
      <form onSubmit={handleSubmit}>
        <div class="modal-body">
          <div class="text-center mb-4">
            <i class="fas fa-edit" style="font-size: 2rem; color: #1e40af; margin-bottom: 1rem;"></i>
            <h4 class="mb-2">Edit Note</h4>
            {props.note && (
              <div class="text-muted small">
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
            )}
          </div>
          
          <div class="mb-3">
            <label class="form-label fw-medium">
              <i class="fas fa-sticky-note me-2"></i>
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
              Make your changes and click "Save Changes" to update the note.
            </div>
          </div>
          
          <div class="mb-3">
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
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onClick={handleClose}>
            <i class="fas fa-times me-2"></i>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save me-2"></i>
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditNoteModal;
