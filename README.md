# Healthcare Notes App

A simple, polished note-taking web application designed for healthcare organizations with a flexible hierarchy system.

## Features

- **Flexible Hierarchy**: Organization → Team → Client → Episode → Note
- **Note Attachment**: Attach notes at any level of the hierarchy
- **Intuitive Navigation**: Tree-based sidebar navigation with breadcrumbs
- **CRUD Operations**: Create, read, update, and delete notes and hierarchy items
- **Local Storage**: Data persists in browser local storage
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, healthcare-appropriate design

## Hierarchy Structure

```
Organization (e.g., City General Hospital)
  Team (e.g., Cardiology Department)
      Client (e.g., John Smith)
          Episode (e.g., Chest Pain Assessment)
```

Notes can be attached to any level:
- **Organization notes**: General policies, announcements
- **Team notes**: Department-specific information, meetings
- **Client notes**: Patient information, care plans
- **Episode notes**: Specific visit details, assessments

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Technology Stack

- **Frontend**: SolidJS
- **Build Tool**: Vite
- **Styling**: CSS3 with custom properties
- **State Management**: SolidJS signals and stores
- **Data Persistence**: Browser localStorage

## Usage

### Adding Items to the Hierarchy

1. Use the "+" buttons next to items in the sidebar to add child items
2. Use "Add Org" button to create new organizations
3. Fill in the name and click "Add"

### Managing Notes

1. Click on any item in the sidebar to view its details
2. Click "Add Note" to create a new note
3. Use "Edit" to modify existing notes
4. Use "Delete" to remove notes (with confirmation)

### Navigation

- Use the sidebar tree to navigate between items
- Use breadcrumbs to navigate back up the hierarchy
- Items show icons to indicate their type

## Sample Data

The app comes with sample data including:
- Two healthcare organizations
- Multiple departments/teams
- Sample clients and episodes
- Example notes at various levels

## Data Structure

The application uses a normalized data structure with separate collections for each hierarchy level:

```javascript
{
  organisations: [...],
  teams: [...],
  clients: [...],
  episodes: [...],
  notes: [...]
}
```

Each item has:
- Unique ID
- Name
- Parent ID (except organizations)
- Creation timestamp
- Type identifier

Notes include:
- Content
- Attached item ID and type
- Creation and update timestamps

## Customization

The hierarchy can be easily extended or modified by:
1. Updating the data structure in `src/store.js`
2. Modifying the navigation logic in `src/components/Sidebar.jsx`
3. Adjusting the UI components as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
