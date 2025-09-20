import { For, Show, createSignal } from 'solid-js';
import { hierarchyTree, selectedItem, setSelectedItem, selectedType, setSelectedType, addItem } from '../store';
import AddItemModal from './AddItemModal';

function Sidebar() {
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [addModalParent, setAddModalParent] = createSignal(null);
  const [addModalType, setAddModalType] = createSignal(null);
  const [isExpanded, setIsExpanded] = createSignal(false);

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
      <li class="list-group-item border-0 p-0 mb-1">
        <div class="d-flex align-items-center justify-content-between">
          <button
            class={`btn btn-link text-start p-2 flex-grow-1 me-2 text-decoration-none d-flex align-items-center ${
              isSelected(item, type) 
                ? 'bg-primary bg-opacity-10 text-primary fw-medium border-0' 
                : 'text-secondary border-0'
            }`}
            onClick={() => selectItem(item, type)}
            style="border-radius: 0.375rem;"
          >
            <span class="me-2" style="font-size: 1rem;">
              {type === 'organisation' &&  <i class='fas fa-hospital' style={{ color: '#bf5b52' }}></i>}
              {type === 'team' && <i class='fas fa-users' style={{ color: '#57ade6' }}></i>}
              {type === 'client' && <i class='fas fa-user' style={{ color: '#2471a3' }}></i>}
              {type === 'episode' && <i class='fas fa-clipboard-list' style={{ color: '#c9c697' }}></i>}
            </span>
            <span style="font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title={item.name}>{item.name}</span>
          </button>
          <Show when={canAddChild}>
            <button
              class="btn btn-outline-secondary btn-sm px-2 py-1"
              onClick={() => showAddModalFor(item, type, childType)}
              title={`Add ${childType}`}
              style="font-size: 0.75rem; min-width: 28px;"
            >
              +
            </button>
          </Show>
        </div>
        <Show when={children && children.length > 0}>
          <ul class="list-unstyled ms-4 mt-1 ps-3 border-start border-2 border-light">
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

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded());
  };

  return (
    <div 
      class="d-flex flex-column h-100 bg-white border-end p-3 sidebar-container" 
      style={`width: ${isExpanded() ? '50%' : '300px'}; overflow-y: auto; transition: width 0.3s ease;`}
    >
      <div class="flex-shrink-0 mb-3">
        <div class="d-flex align-items-center justify-content-between py-2 mb-2 border-bottom">
          <div class="d-flex align-items-center">
            <button
              class="btn btn-outline-secondary btn-sm me-2 p-1"
              onClick={toggleSidebar}
              title={isExpanded() ? 'Collapse sidebar' : 'Expand sidebar'}
              style="width: 28px; height: 28px;"
            >
              <i class={`fas ${isExpanded() ? 'fa-chevron-left' : 'fa-chevron-right'}`} style="font-size: 0.75rem;"></i>
            </button>
            <h2 class="h5 fw-medium text-dark mb-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              Organizations
            </h2>
          </div>
          <button
            class="btn btn-primary btn-sm px-3 py-1"
            onClick={() => showAddModalFor(null, null, 'organisation')}
            style="font-size: 0.75rem; flex-shrink: 0;"
          >
            <i class="fas fa-plus me-1"></i>
            {isExpanded() ? 'Add Organization' : 'Add Org'}
          </button>
        </div>
      </div>
      
      <div class="flex-grow-1 overflow-auto px-3" style="max-height: calc(100vh - 80px);">
        <ul class="list-unstyled mb-0">
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
      </div>

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
