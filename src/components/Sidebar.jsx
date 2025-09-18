import { For, Show, createSignal } from 'solid-js';
import { hierarchyTree, selectedItem, setSelectedItem, selectedType, setSelectedType, addItem } from '../store';
import AddItemModal from './AddItemModal';

function Sidebar() {
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [addModalParent, setAddModalParent] = createSignal(null);
  const [addModalType, setAddModalType] = createSignal(null);

  const selectItem = (item, type) => {
    setSelectedItem(item);
    setSelectedType(type);
  };

  const isSelected = (item, type) => {
    return selectedItem()?.id === item.id && selectedType() === type;
  };

  const showAddModalFor = (parentItem, parentType, childType) => {
    console.log('Sidebar - showAddModalFor called with:', { parentItem, parentType, childType });
    setAddModalParent(parentItem ? { item: parentItem, type: parentType } : null);
    setAddModalType(childType);
    setShowAddModal(true);
    console.log('Sidebar - Modal state set:', { 
      parent: parentItem ? { item: parentItem, type: parentType } : null, 
      type: childType, 
      show: true 
    });
  };

  const handleAddItem = async (name) => {
    console.log('Sidebar - handleAddItem called with name:', name);
    try {
      const parent = addModalParent();
      const parentId = parent && parent.item ? parent.item.id : null;
      const modalType = addModalType();
      console.log('Sidebar - Current modal state:', { 
        modalType, 
        name, 
        parentId, 
        showModal: showAddModal(),
        parent 
      });
      
      if (!modalType) {
        throw new Error('Modal type is null - modal state was not set properly');
      }
      
      const newItem = await addItem(modalType, name, parentId);
      console.log('Sidebar - addItem returned:', newItem);
      
      setShowAddModal(false);
      setAddModalParent(null);
      setAddModalType(null);
      
      // Auto-select the new item
      selectItem(newItem, modalType);
      console.log('Sidebar - Item added successfully');
    } catch (error) {
      console.error('Sidebar - Failed to add item:', error);
      alert(`Failed to add ${modalType || 'item'}: ${error.message}`);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setAddModalParent(null);
    setAddModalType(null);
  };


  const TreeNode = (props) => {
    const { item, type, children, canAddChild, childType } = props;
    
    return (
      <li class="nav-item">
        <div class="flex items-center justify-between">
          <button
            class={`nav-button ${isSelected(item, type) ? 'active' : ''}`}
            onClick={() => selectItem(item, type)}
            style="flex: 1; margin-right: 0.5rem;"
          >
            <span class="text-sm">
              {type === 'organisation' && '🏥'}
              {type === 'team' && '👥'}
              {type === 'client' && '👤'}
              {type === 'episode' && '📋'}
            </span>
            {item.name}
          </button>
          <Show when={canAddChild}>
            <button
              class="btn btn-secondary btn-small"
              onClick={() => showAddModalFor(item, type, childType)}
              title={`Add ${childType}`}
            >
              +
            </button>
          </Show>
        </div>
        <Show when={children && children.length > 0}>
          <ul class="nav-children">
            <For each={children}>
              {(child) => (
                <TreeNode
                  item={child}
                  type={childType}
                  children={child.children}
                  canAddChild={childType !== 'episode'}
                  childType={
                    childType === 'team' ? 'client' :
                    childType === 'client' ? 'episode' : null
                  }
                />
              )}
            </For>
          </ul>
        </Show>
      </li>
    );
  };

  return (
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="flex items-center justify-between">
          <h2 class="font-medium">Organizations</h2>
          <button
            class="btn btn-primary btn-small"
            onClick={() => showAddModalFor(null, null, 'organisation')}
          >
            + Add Org
          </button>
        </div>
      </div>
      
      <ul class="nav-tree">
        <For each={hierarchyTree()}>
          {(org) => (
            <TreeNode
              item={org}
              type="organisation"
              children={org.children}
              canAddChild={true}
              childType="team"
            />
          )}
        </For>
      </ul>

      <AddItemModal
        isOpen={showAddModal()}
        type={addModalType()}
        parentName={addModalParent()?.item?.name}
        onSubmit={handleAddItem}
        onClose={handleCloseModal}
      />

    </div>
  );
}

export default Sidebar;
