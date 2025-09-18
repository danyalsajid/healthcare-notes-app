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
    <nav class="breadcrumb">
      <For each={props.items}>
        {(item, index) => (
          <>
            <span 
              class="breadcrumb-item"
              onClick={() => navigateToItem(item.id, item.type)}
            >
              {item.name}
            </span>
            {index() < props.items.length - 1 && (
              <span class="breadcrumb-separator">→</span>
            )}
          </>
        )}
      </For>
    </nav>
  );
}

export default Breadcrumb;
