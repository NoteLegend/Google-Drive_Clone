import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public/uploads
const uploadsDir = join(__dirname, '..', 'public', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Serve static files from dist folder (production build)
const distPath = join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const parentFolderId = req.body.parentFolderId ? parseInt(req.body.parentFolderId) : null;
    let uploadPath = uploadsDir;

    if (parentFolderId) {
      // Get folder path from database
      const folder = db.get(parentFolderId);
      if (folder) {
        // --- FIX: Use folder.path, not __dirname ---
        // folder.path is relative to public (e.g., 'uploads/My Folder')
        // We need the full FS path, which is relative to the project root
        uploadPath = join(__dirname, '..', 'public', folder.path);
      }
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename if file already exists
    const originalName = file.originalname;
    let filename = originalName;
    let counter = 1;

    const parentFolderId = req.body.parentFolderId ? parseInt(req.body.parentFolderId) : null;
    let uploadPath = uploadsDir;

    if (parentFolderId) {
      const folder = db.get(parentFolderId);
      if (folder) {
        // --- FIX: Use folder.path ---
        uploadPath = join(__dirname, '..', 'public', folder.path);
      }
    }

    while (fs.existsSync(join(uploadPath, filename))) {
      const extMatch = originalName.match(/\.[^.]+$/);
      const ext = extMatch ? extMatch[0] : '';
      const nameWithoutExt = ext ? originalName.substring(0, originalName.lastIndexOf(ext)) : originalName;
      filename = `${nameWithoutExt} (${counter})${ext}`;
      counter++;
    }

    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get file type from extension
function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const typeMap = {
    'pdf': 'pdf',
    'doc': 'document',
    'docx': 'document',
    'xls': 'spreadsheet',
    'xlsx': 'spreadsheet',
    'ppt': 'presentation',
    'pptx': 'presentation',
    'txt': 'document',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
  };
  return typeMap[ext] || 'file';
}

// GET /api/files - Get all files
app.get('/api/files', (req, res) => {
  try {
    const parentFolderId = req.query.parentFolderId ? parseInt(req.query.parentFolderId) : null;
    const starred = req.query.starred === 'true';
    const viewMode = req.query.viewMode || 'my-drive';
    // --- START CHANGES ---
    const search = req.query.search || '';
    
    console.log('GET /api/files - Query params:', { parentFolderId, starred: req.query.starred, starredBoolean: starred, viewMode, search });
    // --- END CHANGES ---
    
    // Read database directly to get all files
    const data = JSON.parse(fs.readFileSync(join(__dirname, '..', 'database.json'), 'utf8'));
    let allFiles = data.files || [];
    
    // --- START SEARCH LOGIC ---
    if (search) {
      allFiles = allFiles.filter(file => 
        file.name.toLowerCase().includes(search.toLowerCase())
      );
      console.log(`Search filter: Found ${allFiles.length} files matching "${search}"`);
    }
    // --- END SEARCH LOGIC ---

    // Filter files based on viewMode
    let files;
    
    // Helper function to check if file is deleted (handles undefined/null values)
    const isDeleted = (file) => file.deleted === true || file.deleted === 1;
    
    // Helper function to check if file is shared (handles undefined/null values)
    const isShared = (file) => file.shared === true || file.shared === 1;
    
    if (viewMode === 'trash') {
      // Show only files that are deleted (in trash)
      files = allFiles.filter(file => isDeleted(file));
      console.log(`Trash filter: Found ${files.length} deleted files out of ${allFiles.length} total files`);
    } else if (viewMode === 'shared') {
      // Show only files that are shared and not deleted
      files = allFiles.filter(file => isShared(file) && !isDeleted(file));
      console.log(`Shared filter: Found ${files.length} shared files out of ${allFiles.length} total files`);
    } else if (viewMode === 'storage') {
      // Show all non-deleted files, sorted by size descending
      files = allFiles.filter(file => !isDeleted(file));
      files = files.sort((a, b) => (b.size || 0) - (a.size || 0));
      console.log(`Storage filter: Found ${files.length} files sorted by size`);
    } else if (viewMode === 'home') {
      // Show all non-deleted files, sorted by modified_at descending
      files = allFiles.filter(file => !isDeleted(file));
      files = files.sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at));
      console.log(`Home filter: Found ${files.length} files sorted by date`);
    } else if (viewMode === 'recent') {
      // Show all files, sorted by modified date (most recent first)
      // Filter out deleted files (undefined deleted means not deleted)
      files = allFiles.filter(file => !isDeleted(file));
      // Sort by modified date (newest first)
      files = files.sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at));
      // Limit to most recent 50 files
      files = files.slice(0, 50);
      console.log(`Recent filter: Found ${files.length} recent files`);
    
    // --- START CHANGES ---
    } else if (starred) {
    // --- END CHANGES ---
      // For starred, we need all files regardless of parent
      // Filter only starred files (starred === 1 or starred === true)
      files = allFiles.filter(file => {
        // Handle both number (1) and boolean (true) values
        const isStarred = file.starred === 1 || file.starred === true || file.starred === '1';
        // Also filter out deleted files
        return isStarred && !isDeleted(file);
      });
      console.log(`Starred filter: Found ${files.length} starred files out of ${allFiles.length} total files`);
    
    // --- START CHANGES ---
    } else if (search) {
      // If we searched, we already have our filtered list from allFiles.
      // Just filter out deleted files.
      files = allFiles.filter(file => !isDeleted(file));
    // --- END CHANGES ---
    
    } else {
      // My Drive: filter by parentFolderId and exclude deleted files
      // --- FIX: Use db.getAll which is the abstraction ---
      files = db.getAll(parentFolderId);
      files = files.filter(file => !isDeleted(file));
    }

    // Sort: folders first, then by modified date (newest first)
    // (Recent is already sorted, so skip sorting for recent)
    if (viewMode !== 'recent') {
      files = files.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return new Date(b.modified_at) - new Date(a.modified_at);
      });
    }

    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.type === 'folder' ? '—' : formatFileSize(file.size),
      modified: new Date(file.modified_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      owner: file.owner || 'me',
      starred: file.starred === 1 || file.starred === true,
      path: file.path,
      parentFolderId: file.parent_folder_id,
      deleted: isDeleted(file)
    }));

    res.json(formattedFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// POST /api/files/upload - Upload a file
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const parentFolderId = req.body.parentFolderId ? parseInt(req.body.parentFolderId) : null;
    let filePath = `uploads/${req.file.filename}`;
    let fsPath = join(uploadsDir, req.file.filename); // Full FS path

    if (parentFolderId) {
      const folder = db.get(parentFolderId);
      if (folder) {
        filePath = `${folder.path}/${req.file.filename}`;
        // --- FIX: Correctly get fsPath from req.file ---
        // req.file.path is the full FS path where multer saved it
        fsPath = req.file.path;
      }
    }

    const fileType = getFileType(req.file.filename);

    const result = db.insert({
      name: req.file.filename,
      type: fileType,
      size: req.file.size,
      path: filePath, // Store the relative path
      parent_folder_id: parentFolderId,
      starred: 0,
      deleted: 0,
      shared: 0,
      owner: 'me'
    });

    res.json({
      id: result.lastInsertRowid,
      name: req.file.filename,
      type: fileType,
      size: formatFileSize(req.file.size),
      path: filePath,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// POST /api/folders - Create a new folder
app.post('/api/folders', (req, res) => {
  try {
    const { name, parentFolderId } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const parsedParentId = parentFolderId ? parseInt(parentFolderId) : null;

    // Check if folder with same name already exists in the same parent
    if (db.exists(name.trim(), parsedParentId)) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    let folderPath = `uploads/${name.trim()}`;
    let fullPath = join(uploadsDir, name.trim());

    if (parsedParentId) {
      const folder = db.get(parsedParentId);
      if (folder) {
        folderPath = `${folder.path}/${name.trim()}`;
        // --- FIX: Correct base path ---
        // folder.path is 'uploads/...'
        // We need to join from the 'public' folder's parent
        fullPath = join(__dirname, '..', 'public', folder.path, name.trim());
      }
    }
    
    // Ensure path uses forward slashes for consistency
    folderPath = folderPath.replace(/\\/g, '/');

    // Create folder directory
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    const result = db.insert({
      name: name.trim(),
      type: 'folder',
      size: 0,
      path: folderPath,
      parent_folder_id: parsedParentId,
      starred: 0,
      deleted: 0,
      shared: 0,
      owner: 'me'
    });

    res.json({
      id: result.lastInsertRowid,
      name: name.trim(),
      type: 'folder',
      size: '—',
      path: folderPath,
      parentFolderId: parsedParentId,
      message: 'Folder created successfully'
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// DELETE /api/files/:id - Delete a file or folder (soft delete - move to trash)
app.delete('/api/files/:id', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = db.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Soft delete: Mark file as deleted instead of permanently deleting
    db.update(fileId, { deleted: 1 });
    console.log(`Moved ${file.type} ${file.name} (ID: ${fileId}) to trash`);

    // If it's a folder, also mark all children as deleted recursively
    if (file.type === 'folder') {
      // --- FIX: Use db.readDB to get ALL files, not just children in current folder ---
      const data = db.readDB();
      let childrenIds = [];

      const findChildrenRecursive = (parentId) => {
        data.files.forEach(f => {
          if (f.parent_folder_id === parentId) {
            childrenIds.push(f.id);
            if (f.type === 'folder') {
              findChildrenRecursive(f.id);
            }
          }
        });
      };

      findChildrenRecursive(fileId);
      console.log(`Moving folder ${file.name} (ID: ${fileId}) with ${childrenIds.length} children to trash`);
      
      // Mark all children as deleted
      childrenIds.forEach(childId => {
        db.update(childId, { deleted: 1 });
      });
    }

    res.json({ message: 'File moved to trash successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file: ' + error.message });
  }
});

// --- START NEW ENDPOINT ---
// PUT /api/files/:id/move - Move a file or folder
app.put('/api/files/:id/move', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    // newParentFolderId can be null (moving to root)
    const newParentFolderId = req.body.newParentFolderId !== undefined ? (req.body.newParentFolderId === null ? null : parseInt(req.body.newParentFolderId)) : undefined;

    if (newParentFolderId === undefined) {
      return res.status(400).json({ error: 'newParentFolderId is required' });
    }

    const file = db.get(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.id === newParentFolderId) {
      return res.status(400).json({ error: 'Cannot move a folder into itself' });
    }

    const oldPath = file.path;
    const oldFsPath = join(__dirname, '..', 'public', oldPath);

    let newParentPath = 'uploads';
    if (newParentFolderId !== null) {
      const newParentFolder = db.get(newParentFolderId);
      if (!newParentFolder) {
        return res.status(404).json({ error: 'Target folder not found' });
      }
      if (newParentFolder.type !== 'folder') {
        return res.status(400).json({ error: 'Target must be a folder' });
      }
      newParentPath = newParentFolder.path;
    }

    const newPath = join(newParentPath, file.name).replace(/\\/g, '/'); // Ensure forward slashes
    const newFsPath = join(__dirname, '..', 'public', newPath);

    // Check for conflicts
    if (db.exists(file.name, newParentFolderId, file.id)) {
       return res.status(400).json({ error: `An item named "${file.name}" already exists in that folder.` });
    }

    // 1. Move file on filesystem
    if (fs.existsSync(oldFsPath)) {
      fs.renameSync(oldFsPath, newFsPath);
      console.log(`Moved fs object from ${oldFsPath} to ${newFsPath}`);
    } else {
      console.warn(`File not found at ${oldFsPath}, updating DB path only.`);
    }

    // 2. Update DB
    db.update(fileId, { parent_folder_id: newParentFolderId, path: newPath });
    
    // 3. (CRITICAL) If it's a folder, update paths of all children
    if (file.type === 'folder') {
      const data = db.readDB(); // Need to read directly to modify
      
      const updateChildPaths = (parentId, parentPath) => {
        data.files.forEach(f => {
          if (f.parent_folder_id === parentId) {
            const childNewPath = join(parentPath, f.name).replace(/\\/g, '/');
            f.path = childNewPath; // Update path in the data object
            if (f.type === 'folder') {
              updateChildPaths(f.id, childNewPath);
            }
          }
        });
      };
      
      updateChildPaths(fileId, newPath);
      db.writeDB(data); // Commit all path changes
    }

    res.json({ message: 'File moved successfully', newPath: newPath });
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ error: 'Failed to move file: ' + error.message });
  }
});
// --- END NEW ENDPOINT ---

// PUT /api/files/:id/star - Toggle star status
app.put('/api/files/:id/star', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = db.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const newStarred = (file.starred === 1 || file.starred === true) ? 0 : 1;
    db.update(fileId, { starred: newStarred });

    res.json({ starred: newStarred === 1 });
  } catch (error) {
    console.error('Error toggling star:', error);
    res.status(500).json({ error: 'Failed to toggle star' });
  }
});

// GET /api/storage - Get storage usage information
app.get('/api/storage', (req, res) => {
  try {
    // Hardcoded values as per requirements
    const totalStorageBytes = 15 * 1024 * 1024 * 1024; // 15 GB
    const totalBytes = 6.2 * 1024 * 1024 * 1024; // 6.2 GB
    const percentage = (totalBytes / totalStorageBytes) * 100;
    
    res.json({
      used: totalBytes,
      total: totalStorageBytes,
      usedFormatted: '6.2 GB',
      totalFormatted: '15 GB',
      percentage: Math.min(percentage, 100) // Cap at 100%
    });
  } catch (error) {
    console.error('Error calculating storage:', error);
    res.status(500).json({ error: 'Failed to calculate storage' });
  }
});

// PUT /api/files/:id/rename - Rename a file or folder
app.put('/api/files/:id/rename', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const { newName } = req.body;

    if (!newName || newName.trim() === '') {
      return res.status(400).json({ error: 'New name is required' });
    }

    const file = db.get(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const trimmedName = newName.trim();

    // Check for conflicts
    if (db.exists(trimmedName, file.parent_folder_id, file.id)) {
      return res.status(400).json({ error: 'An item with this name already exists' });
    }

    // Calculate old and new paths
    const oldPath = file.path;
    const oldFsPath = join(__dirname, '..', 'public', oldPath);
    
    // Extract directory from old path and append new name
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = trimmedName;
    const newPath = pathParts.join('/');
    const newFsPath = join(__dirname, '..', 'public', newPath);

    // Rename on filesystem
    if (fs.existsSync(oldFsPath)) {
      fs.renameSync(oldFsPath, newFsPath);
      console.log(`Renamed fs object from ${oldFsPath} to ${newFsPath}`);
    } else {
      console.warn(`File not found at ${oldFsPath}, updating DB only.`);
    }

    // Update database
    db.update(fileId, { name: trimmedName, path: newPath });

    // If it's a folder, recursively update all children's paths
    if (file.type === 'folder') {
      const data = db.readDB();
      
      const updateChildPaths = (parentId, parentPath) => {
        data.files.forEach(f => {
          if (f.parent_folder_id === parentId) {
            const childNewPath = join(parentPath, f.name).replace(/\\/g, '/');
            f.path = childNewPath;
            if (f.type === 'folder') {
              updateChildPaths(f.id, childNewPath);
            }
          }
        });
      };
      
      updateChildPaths(fileId, newPath);
      db.writeDB(data);
    }

    res.json({ message: 'File renamed successfully', newPath: newPath });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ error: 'Failed to rename file: ' + error.message });
  }
});

// Helper function to get unique copy name
function getUniqueCopyName(name, parentId) {
  let copyName = `Copy of ${name}`;
  let counter = 1;
  
  while (db.exists(copyName, parentId)) {
    const extMatch = name.match(/\.[^.]+$/);
    if (extMatch) {
      const ext = extMatch[0];
      const nameWithoutExt = name.substring(0, name.lastIndexOf(ext));
      copyName = `Copy of ${nameWithoutExt} (${counter})${ext}`;
    } else {
      copyName = `Copy of ${name} (${counter})`;
    }
    counter++;
  }
  
  return copyName;
}

// Helper function to recursively copy a folder
function copyFolderRecursive(oldFsPath, newFsPath, oldDbFolder, newDbFolder, data) {
  // Create the new folder on filesystem
  if (!fs.existsSync(newFsPath)) {
    fs.mkdirSync(newFsPath, { recursive: true });
  }

  // Find all children of the old folder
  const children = data.files.filter(f => f.parent_folder_id === oldDbFolder.id);
  
  // Copy each child
  children.forEach(child => {
    const childOldFsPath = join(__dirname, '..', 'public', child.path);
    const childNewPath = `${newDbFolder.path}/${child.name}`;
    const childNewFsPath = join(__dirname, '..', 'public', childNewPath);

    if (child.type === 'folder') {
      // Recursively copy folder
      const childNewDbFolder = {
        ...child,
        id: data.nextId++,
        name: child.name,
        path: childNewPath,
        parent_folder_id: newDbFolder.id,
        starred: 0
      };
      data.files.push(childNewDbFolder);
      copyFolderRecursive(childOldFsPath, childNewFsPath, child, childNewDbFolder, data);
    } else {
      // Copy file
      if (fs.existsSync(childOldFsPath)) {
        fs.copyFileSync(childOldFsPath, childNewFsPath);
      }
      
      // Insert new file record
      data.files.push({
        ...child,
        id: data.nextId++,
        name: child.name,
        path: childNewPath,
        parent_folder_id: newDbFolder.id,
        starred: 0
      });
    }
  });
}

// POST /api/files/:id/copy - Make a copy of a file or folder
app.post('/api/files/:id/copy', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = db.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get unique copy name
    const newName = getUniqueCopyName(file.name, file.parent_folder_id);
    
    // Calculate new path
    let newPath;
    if (file.parent_folder_id === null) {
      newPath = `uploads/${newName}`;
    } else {
      const parentFolder = db.get(file.parent_folder_id);
      newPath = `${parentFolder.path}/${newName}`;
    }
    const newFsPath = join(__dirname, '..', 'public', newPath);

    // Insert new record
    const result = db.insert({
      name: newName,
      type: file.type,
      size: file.size || 0,
      path: newPath,
      parent_folder_id: file.parent_folder_id,
      starred: 0,
      deleted: 0,
      shared: 0,
      owner: file.owner || 'me'
    });

    const newDbFile = db.get(result.lastInsertRowid);

    // Copy on filesystem
    const oldFsPath = join(__dirname, '..', 'public', file.path);

    if (file.type === 'folder') {
      // Recursive folder copy
      const data = db.readDB();
      copyFolderRecursive(oldFsPath, newFsPath, file, newDbFile, data);
      db.writeDB(data);
    } else {
      // File copy
      if (fs.existsSync(oldFsPath)) {
        fs.copyFileSync(oldFsPath, newFsPath);
      }
    }

    res.json({ message: 'File copied successfully', newFile: newDbFile });
  } catch (error) {
    console.error('Error copying file:', error);
    res.status(500).json({ error: 'Failed to copy file: ' + error.message });
  }
});

// PUT /api/files/:id/restore - Restore a file or folder from trash
app.put('/api/files/:id/restore', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = db.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Restore the file
    db.update(fileId, { deleted: 0 });

    // Restore parent chain
    let currentParentId = file.parent_folder_id;
    while (currentParentId !== null) {
      const parent = db.get(currentParentId);
      if (parent && (parent.deleted === 1 || parent.deleted === true)) {
        db.update(currentParentId, { deleted: 0 });
        currentParentId = parent.parent_folder_id;
      } else {
        break;
      }
    }

    // If it's a folder, recursively restore all children
    if (file.type === 'folder') {
      const data = db.readDB();
      
      const restoreChildren = (parentId) => {
        data.files.forEach(f => {
          if (f.parent_folder_id === parentId) {
            if (f.deleted === 1 || f.deleted === true) {
              f.deleted = 0;
            }
            if (f.type === 'folder') {
              restoreChildren(f.id);
            }
          }
        });
      };
      
      restoreChildren(fileId);
      db.writeDB(data);
    }

    res.json({ message: 'File restored successfully' });
  } catch (error) {
    console.error('Error restoring file:', error);
    res.status(500).json({ error: 'Failed to restore file: ' + error.message });
  }
});

// DELETE /api/files/:id/permanent - Permanently delete a file or folder
app.delete('/api/files/:id/permanent', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = db.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = join(__dirname, '..', 'public', file.path);

    // Delete from filesystem
    if (fs.existsSync(filePath)) {
      if (file.type === 'folder') {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
      console.log(`Deleted ${file.type} from filesystem: ${filePath}`);
    }

    // Delete from database (this is already recursive)
    db.delete(fileId);

    res.json({ message: 'File permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting file:', error);
    res.status(500).json({ error: 'Failed to permanently delete file: ' + error.message });
  }
});

// GET /api/files/:id/download - Download a file
app.get('/api/files/:id/download', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = db.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: 'Cannot download a folder' });
    }

    // Construct the full file path - file.path is relative like "uploads/filename"
    // The base is 'public'
    let filePath = join(__dirname, '..', 'public', file.path);
    
    // Handle potential mismatch if path already includes 'public' (it shouldn't based on logic)
    if (file.path.startsWith('public/')) {
      filePath = join(__dirname, '..', file.path);
    }

    if (!fs.existsSync(filePath)) {
      console.error(`File not found on disk at: ${filePath}`);
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Use res.download which handles headers and file streaming automatically
    res.download(filePath, file.name, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  // Don't interfere with API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // Only serve index.html if dist folder exists (production build)
  const indexHtmlPath = join(distPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    // In development, if dist doesn't exist, send a helpful message
    res.status(200).json({ 
      message: 'Vite dev server is running. This is the production backend.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});