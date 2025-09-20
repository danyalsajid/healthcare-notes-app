import { For } from 'solid-js';
import { setSelectedItem, setSelectedType, getItemById } from '../store';

function Breadcrumb(props) {
  const navigateToItem = (itemId, itemType) => {
    const item = getItemById(itemId, itemType);
    if (item) {
      setSelectedItem(item);
      setSelectedType(itemType);
    }
  };

  return (
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb bg-light rounded px-3 py-2 mb-0">
        <For each={props.items}>
          {(item, index) => (
            <li class={`breadcrumb-item ${index() === props.items.length - 1 ? 'active' : ''}`}>
              {index() === props.items.length - 1 ? (
                <span class="text-dark fw-medium">{item.name}</span>
              ) : (
                <button
                  type="button"
                  class="btn btn-link p-0 text-decoration-none fw-medium"
                  onClick={() => navigateToItem(item.id, item.type)}
                >
                  {item.name}
                </button>
              )}
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
}

export default Breadcrumb;
