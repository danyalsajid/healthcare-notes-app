import { createSignal, Show, For } from 'solid-js';
import { searchQuery, searchResults, isSearching, searchAllNotes, clearSearch, selectSearchResult } from '../store';

function SearchBar() {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [inputValue, setInputValue] = createSignal('');

  const handleSearch = (value) => {
    setInputValue(value);
    if (value.trim()) {
      searchAllNotes(value);
      setIsExpanded(true);
    } else {
      clearSearch();
      setIsExpanded(false);
    }
  };

  const handleResultClick = (note) => {
    selectSearchResult(note);
    setInputValue('');
    setIsExpanded(false);
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    setIsExpanded(false);
  };

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-warning bg-opacity-50">$1</mark>');
  };

  return (
    <div class="search-container position-relative">
      <div class="input-group">
        <span class="input-group-text bg-white border-end-0">
          <i class="fas fa-search text-muted"></i>
        </span>
        <input
          type="text"
          class="form-control border-start-0 ps-0"
          placeholder="Search notes..."
          value={inputValue()}
          onInput={(e) => handleSearch(e.target.value)}
          onFocus={() => inputValue() && setIsExpanded(true)}
          style="box-shadow: none; border-color: #dee2e6;"
        />
        <Show when={inputValue()}>
          <button
            class="btn btn-outline-secondary border-start-0"
            type="button"
            onClick={handleClear}
            title="Clear search"
          >
            <i class="fas fa-times"></i>
          </button>
        </Show>
      </div>

      <Show when={isExpanded() && (searchResults().length > 0 || isSearching())}>
        <div 
          class="search-dropdown position-absolute w-100 bg-white border rounded-bottom shadow-lg"
          style="top: 100%; z-index: 1050; max-height: 400px; overflow-y: auto;"
        >
          <Show when={isSearching()}>
            <div class="p-3 text-center text-muted">
              <i class="fas fa-spinner fa-spin me-2"></i>
              Searching...
            </div>
          </Show>
          
          <Show when={!isSearching() && searchResults().length === 0 && inputValue()}>
            <div class="p-3 text-center text-muted">
              <i class="fas fa-search me-2"></i>
              No notes found for "{inputValue()}"
            </div>
          </Show>

          <Show when={!isSearching() && searchResults().length > 0}>
            <div class="p-2">
              <div class="small text-muted mb-2 px-2">
                Found {searchResults().length} note{searchResults().length !== 1 ? 's' : ''}
              </div>
              <For each={searchResults()}>
                {(note) => (
                  <button
                    class="btn btn-light w-100 text-start p-3 mb-1 border-0"
                    onClick={() => handleResultClick(note)}
                    style="border-radius: 0.375rem;"
                  >
                    <div class="d-flex align-items-start">
                      <i class="fas fa-sticky-note text-primary me-3 mt-1" style="font-size: 0.875rem;"></i>
                      <div class="flex-grow-1 min-w-0">
                        <div 
                          class="fw-medium mb-1 small"
                          innerHTML={highlightMatch(truncateText(note.content), inputValue())}
                        ></div>
                        <div class="text-muted small d-flex align-items-center">
                          <i class="fas fa-sitemap me-1" style="font-size: 0.75rem;"></i>
                          <span class="text-truncate">{note.hierarchy}</span>
                        </div>
                        <div class="text-muted small mt-1">
                          <i class="fas fa-calendar me-1" style="font-size: 0.75rem;"></i>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      {/* Backdrop to close dropdown when clicking outside */}
      <Show when={isExpanded()}>
        <div 
          class="position-fixed top-0 start-0 w-100 h-100"
          style="z-index: 1040;"
          onClick={() => setIsExpanded(false)}
        ></div>
      </Show>
    </div>
  );
}

export default SearchBar;
