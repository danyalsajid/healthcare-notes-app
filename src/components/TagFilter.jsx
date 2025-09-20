import { Show, For, createEffect } from 'solid-js';
import { availableTags, selectedTags, toggleTagFilter, clearTagFilters, updateAvailableTags } from '../store';

function TagFilter() {
  // Update available tags when component mounts
  createEffect(() => {
    updateAvailableTags();
  });

  const handleTagClick = (tag) => {
    toggleTagFilter(tag);
  };

  const handleClearFilters = () => {
    clearTagFilters();
  };

  return (
    <div class="tag-filter-container">
      <Show when={availableTags().length > 0}>
        <div class="d-flex align-items-center gap-2">
          <div class="d-flex align-items-center">
            <i class="fas fa-filter me-2 text-muted"></i>
            <span class="small text-muted fw-medium">Filter by tags:</span>
          </div>
          
          <div class="d-flex flex-wrap gap-1">
            <For each={availableTags()}>
              {(tag) => {
                const isSelected = () => selectedTags().includes(tag);
                return (
                  <button
                    type="button"
                    class={`btn btn-sm ${isSelected() ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleTagClick(tag)}
                    title={isSelected() ? `Remove filter: ${tag}` : `Filter by: ${tag}`}
                  >
                    <i class={`fas ${isSelected() ? 'fa-check' : 'fa-tag'} me-1`}></i>
                    {tag}
                  </button>
                );
              }}
            </For>
          </div>
          
          <Show when={selectedTags().length > 0}>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              onClick={handleClearFilters}
              title="Clear all filters"
            >
              <i class="fas fa-times me-1"></i>
              Clear
            </button>
          </Show>
        </div>
        
        <Show when={selectedTags().length > 0}>
          <div class="mt-2">
            <small class="text-muted">
              <i class="fas fa-info-circle me-1"></i>
              Showing notes with tags: {selectedTags().join(', ')}
            </small>
          </div>
        </Show>
      </Show>
    </div>
  );
}

export default TagFilter;
