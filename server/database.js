import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path (JSON instead of SQLite)
const dbPath = join(__dirname, '..', 'database.json');

// Ensure uploads directory exists
const uploadsDir = join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ files: [], nextId: 1 }, null, 2));
}

// Read database
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { files: [], nextId: 1 };
  }
};

// Write database
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
    throw error;
  }
};

// Database API (similar interface to SQLite)
const db = {
  // Get all files with optional parent filter
  getAll: (parentFolderId = null) => {
    const data = readDB();
    if (parentFolderId === null) {
      return data.files.filter(file => file.parent_folder_id === null);
    }
    return data.files.filter(file => file.parent_folder_id === parentFolderId);
  },

  // Get file by ID
  get: (id) => {
    const data = readDB();
    return data.files.find(file => file.id === id) || null;
  },

  // Insert a new file
  insert: (fileData) => {
    const data = readDB();
    const newFile = {
      id: data.nextId++,
      ...fileData,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    };
    data.files.push(newFile);
    writeDB(data);
    return { lastInsertRowid: newFile.id };
  },

  // Update a file
  update: (id, updates) => {
    const data = readDB();
    const fileIndex = data.files.findIndex(file => file.id === id);
    if (fileIndex === -1) {
      return null;
    }
    data.files[fileIndex] = {
      ...data.files[fileIndex],
      ...updates,
      modified_at: new Date().toISOString(),
    };
    writeDB(data);
    return data.files[fileIndex];
  },

  // Delete a file (and all children if it's a folder)
  delete: (id) => {
    const data = readDB();
    
    // Find the file to be deleted
    const file = data.files.find(f => f.id === id);
    if (!file) return; // File not found

    let idsToDelete = [id];

    // If it's a folder, recursively find all children
    if (file.type === 'folder') {
      const findAllChildren = (parentId) => {
        const children = data.files.filter(file => file.parent_folder_id === parentId);
        let allChildren = [...children];
        children.forEach(child => {
          if (child.type === 'folder') {
            allChildren = allChildren.concat(findAllChildren(child.id));
          }
        });
        return allChildren;
      };
      
      const children = findAllChildren(id);
      idsToDelete = idsToDelete.concat(children.map(c => c.id));
    }

    data.files = data.files.filter(file => !idsToDelete.includes(file.id));
    writeDB(data);
  },

  // Check if file exists with same name in same parent
  exists: (name, parentFolderId, excludeId = null) => {
    const data = readDB();
    return data.files.some(file => 
      file.name === name && 
      file.parent_folder_id === parentFolderId &&
      file.id !== excludeId
    );
  },

  // --- NEWLY EXPOSED ---
  readDB: readDB,
  writeDB: writeDB
};

export default db;