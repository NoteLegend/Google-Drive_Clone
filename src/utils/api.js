const API_BASE = '/api';

export const fetchFiles = async (parentFolderId = null) => {
  const url = parentFolderId 
    ? `${API_BASE}/files?parentFolderId=${parentFolderId}`
    : `${API_BASE}/files`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }
  return response.json();
};

export const uploadFile = async (file, parentFolderId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (parentFolderId) {
    formData.append('parentFolderId', parentFolderId);
  }

  const response = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
};

export const createFolder = async (name, parentFolderId = null) => {
  const response = await fetch(`${API_BASE}/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, parentFolderId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create folder');
  }

  return response.json();
};

export const deleteFile = async (fileId) => {
  const response = await fetch(`${API_BASE}/files/${fileId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete file');
  }

  return response.json();
};

export const toggleStar = async (fileId) => {
  const response = await fetch(`${API_BASE}/files/${fileId}/star`, {
    method: 'PUT',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle star');
  }

  return response.json();
};

export const getStorageInfo = async () => {
  const response = await fetch(`${API_BASE}/storage`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch storage info');
  }
  
  return response.json();
};

export const downloadFile = async (fileId, fileName) => {
  const response = await fetch(`${API_BASE}/files/${fileId}/download`);
  
  if (!response.ok) {
    // Check if response is JSON before trying to parse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to download file');
    } else {
      // If it's HTML or other non-JSON, throw a generic error
      throw new Error('Failed to download file: Server returned an error');
    }
  }

  // Get the blob from the response
  const blob = await response.blob();
  
  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob);
  
  // Create a temporary anchor element and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};