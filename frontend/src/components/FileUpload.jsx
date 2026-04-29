import React, { useState, useCallback } from 'react'
import axios from 'axios'

function FileUpload({ onUploadComplete, loading }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file)
      }
    }
  }, [])

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      onUploadComplete(response.data)
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload error:', error)
      alert('上传失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploading(false)
    }
  }, [selectedFile, onUploadComplete])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">上传CSV文件</h2>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={handleUpload}
                disabled={uploading || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>确认上传</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">
                拖拽CSV文件到这里，或点击选择文件
              </p>
              <p className="text-sm text-gray-500">
                支持从Stripe、ChartMogul、Baremetrics等平台导出的CSV文件
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FileUpload
