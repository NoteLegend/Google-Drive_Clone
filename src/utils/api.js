const API_BASE = '/api';

export const fetchFiles = async (parentFolderId = null, starred = false) => {
  let url = `${API_BASE}/files`;
  const params = new URLSearchParams();
  
  // If starred is true, don't send parentFolderId
  if (starred) {
    params.append('starred', 'true');
  } else if (parentFolderId !== null) {
    params.append('parentFolderId', parentFolderId);
  }
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  console.log('fetchFiles called with:', { parentFolderId, starred, url });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch files');
  }
  const data = await response.json();
  console.log('fetchFiles response:', data.length, 'files');
  return data;
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
  // Simply create a download link and trigger it
  const url = `${API_BASE}/files/${fileId}/download`;
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};