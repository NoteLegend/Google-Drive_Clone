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
        uploadPath = join(__dirname, '..', folder.path);
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
        uploadPath = join(__dirname, '..', folder.path);
      }
    }

    while (fs.existsSync(join(uploadPath, filename))) {
      const ext = originalName.substring(originalName.lastIndexOf('.'));
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
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
    
    console.log('GET /api/files - Query params:', { parentFolderId, starred: req.query.starred, starredBoolean: starred });
    
    // Read database directly to get all files for starred filter
    let files;
    if (starred) {
      // For starred, we need all files regardless of parent
      const data = JSON.parse(fs.readFileSync(join(__dirname, '..', 'database.json'), 'utf8'));
      const allFiles = data.files || [];
      console.log(`Total files in database: ${allFiles.length}`);
      console.log('Sample file starred values:', allFiles.slice(0, 3).map(f => ({ id: f.id, name: f.name, starred: f.starred, starredType: typeof f.starred })));
      
      // Filter only starred files (starred === 1 or starred === true)
      files = allFiles.filter(file => {
        // Handle both number (1) and boolean (true) values
        const isStarred = file.starred === 1 || file.starred === true || file.starred === '1';
        if (!isStarred) {
          console.log(`Filtered out: ${file.name} (starred=${file.starred}, type=${typeof file.starred})`);
        }
        return isStarred;
      });
      
      console.log(`Starred filter: Found ${files.length} starred files out of ${allFiles.length} total files`);
    } else {
      files = db.getAll(parentFolderId);
    }

    // Sort: folders first, then by modified date (newest first)
    files = files.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return new Date(b.modified_at) - new Date(a.modified_at);
    });

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
      starred: file.starred === 1,
      path: file.path,
      parentFolderId: file.parent_folder_id
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

    if (parentFolderId) {
      const folder = db.get(parentFolderId);
      if (folder) {
        filePath = `${folder.path}/${req.file.filename}`;
      }
    }

    const fileType = getFileType(req.file.filename);

    const result = db.insert({
      name: req.file.filename,
      type: fileType,
      size: req.file.size,
      path: filePath,
      parent_folder_id: parentFolderId,
      starred: 0,
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
        // Files are stored in public/uploads, so include 'public' in the path
        fullPath = join(__dirname, '..', 'public', folder.path, name.trim());
      }
    }

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

// DELETE /api/files/:id - Delete a file or folder
app.delete('/api/files/:id', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = db.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // If it's a folder, delete all contents recursively
    if (file.type === 'folder') {
      const findAllChildren = (parentId) => {
        const children = db.getAll(parentId);
        let allChildren = [...children];
        children.forEach(child => {
          if (child.type === 'folder') {
            allChildren = allChildren.concat(findAllChildren(child.id));
          }
        });
        return allChildren;
      };

      const children = findAllChildren(fileId);
      console.log(`Deleting folder ${file.name} (ID: ${fileId}) with ${children.length} children`);
      
      // Delete all children first (files and subfolders)
      children.forEach(child => {
        // Files are stored in public/uploads, so include 'public' in the path
        const fullPath = join(__dirname, '..', 'public', child.path);
        console.log(`Deleting child: ${child.name} at path: ${fullPath}`);
        
        try {
          if (fs.existsSync(fullPath)) {
            if (child.type === 'folder') {
              fs.rmSync(fullPath, { recursive: true, force: true });
              console.log(`Deleted folder: ${fullPath}`);
            } else {
              fs.unlinkSync(fullPath);
              console.log(`Deleted file: ${fullPath}`);
            }
          } else {
            console.warn(`Path does not exist (may have been deleted already): ${fullPath}`);
          }
        } catch (err) {
          console.error(`Error deleting child ${child.name} at ${fullPath}:`, err);
          // Continue deleting other children even if one fails
        }
        
        // Delete from database
        db.delete(child.id);
      });
      
      // Delete folder directory itself - files are stored in public/uploads
      const folderPath = join(__dirname, '..', 'public', file.path);
      console.log(`Deleting main folder at path: ${folderPath}`);
      
      try {
        if (fs.existsSync(folderPath)) {
          fs.rmSync(folderPath, { recursive: true, force: true });
          console.log(`Successfully deleted folder: ${folderPath}`);
        } else {
          console.warn(`Folder path does not exist (may have been deleted already): ${folderPath}`);
        }
      } catch (err) {
        console.error(`Error deleting folder at ${folderPath}:`, err);
        throw err; // Re-throw if main folder deletion fails
      }
    } else {
      // Delete file - files are stored in public/uploads
      const filePath = join(__dirname, '..', 'public', file.path);
      console.log(`Deleting file: ${file.name} at path: ${filePath}`);
      
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Successfully deleted file: ${filePath}`);
        } else {
          console.warn(`File path does not exist (may have been deleted already): ${filePath}`);
        }
      } catch (err) {
        console.error(`Error deleting file at ${filePath}:`, err);
        throw err; // Re-throw if file deletion fails
      }
    }

    // Delete from database
    db.delete(fileId);
    console.log(`Deleted ${file.type} ${file.name} (ID: ${fileId}) from database`);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file: ' + error.message });
  }
});

// PUT /api/files/:id/star - Toggle star status
app.put('/api/files/:id/star', (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = db.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const newStarred = file.starred === 1 ? 0 : 1;
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
    // Read database directly to get all files recursively
    const data = JSON.parse(fs.readFileSync(join(__dirname, '..', 'database.json'), 'utf8'));
    const allFiles = data.files || [];
    
    // Filter out folders (they don't take storage space)
    const filesOnly = allFiles.filter(file => file.type !== 'folder');
    
    // Calculate total size in bytes
    const totalBytes = filesOnly.reduce((sum, file) => sum + (file.size || 0), 0);
    
    // Total storage limit (15 GB in bytes)
    const totalStorageBytes = 15 * 1024 * 1024 * 1024; // 15 GB
    
    // Calculate percentage
    const percentage = (totalBytes / totalStorageBytes) * 100;
    
    res.json({
      used: totalBytes,
      total: totalStorageBytes,
      usedFormatted: formatFileSize(totalBytes),
      totalFormatted: '15 GB',
      percentage: Math.min(percentage, 100) // Cap at 100%
    });
  } catch (error) {
    console.error('Error calculating storage:', error);
    res.status(500).json({ error: 'Failed to calculate storage' });
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

    // Construct the full file path - file.path is relative like "uploads/filename" or "uploads/folder/filename"
    // Files are stored in public/uploads, so we need to include 'public' in the path
    let filePath = join(__dirname, '..', 'public', file.path);
    
    // If file.path already starts with 'public/', don't add it again
    if (file.path.startsWith('public/')) {
      filePath = join(__dirname, '..', file.path);
    }

    if (!fs.existsSync(filePath)) {
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
    res.status(503).json({ 
      error: 'Production build not found. Please run "npm run build" first.',
      message: 'This server is for production. For development, use "npm run dev:full"'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});