# GitHub Synchronization Instructions

## Current Project Status
- **Version**: Implementa modalità modifica massiva per data
- **Date**: January 15, 2025
- **Components**: Complete school grade management system

## Files to Sync with GitHub

### Core Application Files
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles

### Components
- `src/components/Login.tsx` - Authentication component
- `src/components/Sidebar.tsx` - Navigation sidebar
- `src/components/GestioneClassi.tsx` - Class management
- `src/components/GestioneMaterie.tsx` - Subject management
- `src/components/GestioneAlunni.tsx` - Student management
- `src/components/RegistroVoti.tsx` - Grade registry (with bulk edit functionality)
- `src/components/MedieStatistiche.tsx` - Statistics and averages
- `src/components/DatabaseManager.tsx` - Database management

### Context & Types
- `src/contexts/AppContext.tsx` - Application state management
- `src/types/index.ts` - TypeScript type definitions

### Utilities
- `src/utils/database.ts` - IndexedDB database operations
- `src/utils/pdfExport.ts` - PDF export functionality
- `src/utils/excelExport.ts` - Excel export functionality

### Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node-specific TypeScript config
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration
- `index.html` - HTML template

## Key Features Implemented
1. **Authentication System** - Login with credentials (maestra/foscolo)
2. **Class Management** - Create, edit, delete classes
3. **Subject Management** - Manage school subjects
4. **Student Management** - Student registration and management
5. **Grade Registry** - Record and manage grades with bulk edit functionality
6. **Statistics** - View averages and generate reports
7. **Database Management** - Backup, restore, import/export
8. **PDF/Excel Export** - Generate reports in multiple formats

## Recent Changes
- Implemented bulk edit functionality for grades by date
- Enhanced grade registry with mass editing capabilities
- Improved user interface for batch operations

## Manual Sync Steps

1. **Download/Copy Files**: Copy all the files listed above to your local repository
2. **Install Dependencies**: Run `npm install` to install all required packages
3. **Commit Changes**: 
   ```bash
   git add .
   git commit -m "Sync: Implementa modalità modifica massiva per data"
   ```
4. **Push to GitHub**:
   ```bash
   git push origin main
   ```

## Dependencies
The project uses these main dependencies:
- React 18.3.1
- TypeScript 5.5.3
- Tailwind CSS 3.4.1
- Lucide React 0.344.0
- jsPDF 3.0.1
- XLSX 0.18.5
- better-sqlite3 12.2.0

## Notes
- The application uses IndexedDB for local data storage
- All data is stored in the browser's local storage
- The system is designed for elementary school grade management
- Authentication is simple (username: maestra, password: foscolo)