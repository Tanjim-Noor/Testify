import apiClient from '@/utils/axios'
import { log, error } from '@/utils/logger'

/**
 * Upload response from the server
 */
export interface UploadResponse {
  success: boolean
  file_url: string
  filename: string
  file_size: number
  mime_type: string
  message: string
}

/**
 * Upload an image file for exam answer
 * Endpoint: POST /api/uploads/images
 * @param file - The image file to upload
 * @param studentExamId - Student exam ID for organization
 * @param questionId - Question ID for organization
 * @returns Upload response with file URL and metadata
 */
export async function uploadImage(
  file: File,
  studentExamId?: string,
  questionId?: string
): Promise<UploadResponse> {
  try {
    log('UploadsAPI', 'Uploading image', { 
      filename: file.name, 
      size: file.size, 
      type: file.type,
      studentExamId,
      questionId
    })

    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    
    // Add optional parameters as query params
    const params = new URLSearchParams()
    if (studentExamId) params.append('student_exam_id', studentExamId)
    if (questionId) params.append('question_id', questionId)
    
    const queryString = params.toString()
    const url = `/api/uploads/images${queryString ? `?${queryString}` : ''}`

    // Upload file
    const res = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    log('UploadsAPI', 'Image uploaded successfully', res.data)
    return res.data as UploadResponse
  } catch (err) {
    error('UploadsAPI', 'uploadImage failed', err)
    throw err
  }
}

/**
 * Get the full URL for an uploaded image
 * @param fileUrl - The relative file URL from the server
 * @returns Full URL to the image
 */
export function getImageUrl(fileUrl: string): string {
  if (!fileUrl) return ''
  
  // If it's already a full URL, return as-is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl
  }
  
  // Otherwise, prepend the API base URL
  const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000'
  return `${baseURL}${fileUrl}`
}

/**
 * Fetch image as blob URL with authentication
 * This is needed because img tags don't send auth headers
 * @param fileUrl - The relative file URL from the server
 * @returns Promise resolving to a blob URL
 */
export async function getAuthenticatedImageUrl(fileUrl: string): Promise<string> {
  try {
    if (!fileUrl) return ''
    
    log('UploadsAPI', 'Fetching authenticated image', fileUrl)
    
    const response = await apiClient.get(fileUrl, {
      responseType: 'blob',
    })
    
    // Create a blob URL from the response
    const blobUrl = window.URL.createObjectURL(response.data)
    return blobUrl
  } catch (err) {
    error('UploadsAPI', 'Failed to fetch authenticated image', err)
    throw err
  }
}

/**
 * Download an image file
 * @param fileUrl - The file URL to download
 * @param filename - Optional filename for the download
 */
export async function downloadImage(fileUrl: string, filename?: string): Promise<void> {
  try {
    log('UploadsAPI', 'Downloading image', fileUrl)
    
    const fullUrl = getImageUrl(fileUrl)
    const res = await apiClient.get(fullUrl, {
      responseType: 'blob',
    })
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename || 'image.jpg')
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    log('UploadsAPI', 'Image downloaded successfully')
  } catch (err) {
    error('UploadsAPI', 'downloadImage failed', err)
    throw err
  }
}
