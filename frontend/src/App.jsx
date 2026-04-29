import React, { useState, useCallback } from 'react'
import axios from 'axios'
import FileUpload from './components/FileUpload'
import LLMConfig from './components/LLMConfig'
import MetricsDashboard from './components/MetricsDashboard'
import HeatmapChart from './components/HeatmapChart'
import UserSegmentation from './components/UserSegmentation'
import HighRiskUsers from './components/HighRiskUsers'

function App() {
  const [currentTaskId, setCurrentTaskId] = useState(null)
  const [uploadInfo, setUploadInfo] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('upload')

  const handleUploadComplete = useCallback((data) => {
    setUploadInfo(data)
    setCurrentTaskId(data.task_id)
    setAnalysisResult(null)
    setError(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!currentTaskId) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(`/api/analyze/${currentTaskId}`)
      setAnalysisResult(response.data)
      setActiveTab('results')
    } catch (err) {
      setError(err.response?.data?.detail || '分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [currentTaskId])

  const handleReset = useCallback(() => {
    setCurrentTaskId(null)
    setUploadInfo(null)
    setAnalysisResult(null)
    setLoading(false)
    setError(null)
    setActiveTab('upload')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ChurnRadar</h1>
                <p className="text-sm text-gray-500">客户流失智能分析系统</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {uploadInfo && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">任务ID:</span> {currentTaskId}
                </div>
              )}
              <LLMConfig />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {!analysisResult ? (
          <div className="space-y-6">
            <FileUpload onUploadComplete={handleUploadComplete} loading={loading} />
            
            {uploadInfo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">上传信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">文件名</p>
                    <p className="text-base font-medium text-gray-900">{uploadInfo.filename}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">数据行数</p>
                    <p className="text-base font-medium text-gray-900">{uploadInfo.total_rows}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">任务ID</p>
                    <p className="text-base font-medium text-gray-900">{uploadInfo.task_id}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center space-x-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>分析中...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>开始分析</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    重新上传
                  </button>
                </div>
              </div>
            )}

            {!uploadInfo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">支持的数据格式</h3>
                  <p className="text-gray-600 mb-6">系统支持从以下平台导出的CSV文件：</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="text-2xl mb-2">💳</div>
                      <h4 className="font-medium text-blue-900">Stripe</h4>
                      <p className="text-sm text-blue-700">订阅数据导出</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="text-2xl mb-2">📈</div>
                      <h4 className="font-medium text-green-900">ChartMogul</h4>
                      <p className="text-sm text-green-700">订阅分析平台</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="text-2xl mb-2">💰</div>
                      <h4 className="font-medium text-purple-900">Baremetrics</h4>
                      <p className="text-sm text-purple-700">订阅指标平台</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
                    <h4 className="font-medium text-gray-900 mb-2">建议的CSV列名：</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <code className="bg-white px-2 py-1 rounded">customer_id</code>
                      <code className="bg-white px-2 py-1 rounded">last_activity_date</code>
                      <code className="bg-white px-2 py-1 rounded">monthly_revenue</code>
                      <code className="bg-white px-2 py-1 rounded">support_tickets_count</code>
                      <code className="bg-white px-2 py-1 rounded">payment_failures</code>
                      <code className="bg-white px-2 py-1 rounded">consecutive_failures</code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('results')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'results'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    分析结果
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'users'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    高危用户
                  </button>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                重新上传
              </button>
            </div>

            {activeTab === 'results' && (
              <div className="space-y-6">
                <MetricsDashboard metrics={analysisResult.metrics} totalUsers={analysisResult.total_users} />
                
                <HeatmapChart 
                  data={analysisResult.heatmap_data} 
                  labels={analysisResult.heatmap_labels}
                />
                
                <UserSegmentation 
                  segments={analysisResult.user_segments}
                  taskId={currentTaskId}
                />
              </div>
            )}

            {activeTab === 'users' && (
              <HighRiskUsers 
                users={analysisResult.high_risk_users}
                taskId={currentTaskId}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
