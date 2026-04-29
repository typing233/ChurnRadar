import React, { useState } from 'react'
import axios from 'axios'

function UserSegmentation({ segments, taskId }) {
  const [expandedSegment, setExpandedSegment] = useState(null)
  const [exporting, setExporting] = useState(false)

  if (!segments || segments.length === 0) return null

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await axios.post(`/api/export/${taskId}`, {}, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `high_risk_users_${taskId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + (error.response?.data?.detail || error.message))
    } finally {
      setExporting(false)
    }
  }

  const getRiskBadge = (riskLevel) => {
    const styles = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    const labels = {
      critical: '极高风险',
      high: '高风险',
      medium: '中等风险',
      low: '低风险'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[riskLevel] || styles.medium}`}>
        {labels[riskLevel] || '中等风险'}
      </span>
    )
  }

  const getSegmentIcon = (segmentId) => {
    const icons = {
      high_value_at_risk: '💰',
      silent_users: '😴',
      payment_issues: '💳',
      support_heavy: '🎫',
      low_risk: '✅'
    }
    return icons[segmentId] || '👤'
  }

  const highRiskSegments = segments.filter(s => s.risk_level === 'critical' || s.risk_level === 'high')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">用户分群看板</h2>
          <p className="text-sm text-gray-500 mt-1">
            根据流失风险特征自动划分用户群体
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <>
              <div className="loading-spinner w-4 h-4"></div>
              <span>导出中...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>导出高危用户</span>
            </>
          )}
        </button>
      </div>

      {highRiskSegments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-red-700 mb-3 flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span>需要立即关注的用户群体</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highRiskSegments.map((segment, index) => (
              <div
                key={index}
                className="segment-card bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 cursor-pointer"
                onClick={() => setExpandedSegment(expandedSegment === segment.id ? null : segment.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getSegmentIcon(segment.id)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{segment.name}</h4>
                      <p className="text-sm text-gray-600">{segment.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{segment.users?.length || 0}</p>
                    <p className="text-xs text-gray-500">用户数</p>
                  </div>
                </div>

                {expandedSegment === segment.id && segment.users && segment.users.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-200">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-red-200">
                          <th className="pb-2">用户ID</th>
                          <th className="pb-2">风险分数</th>
                          <th className="pb-2">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {segment.users.slice(0, 10).map((user, userIndex) => (
                          <tr key={userIndex} className="border-b border-red-100 last:border-0">
                            <td className="py-2 font-mono text-xs text-gray-600">
                              {user.customer_id || user.email || '用户' + (userIndex + 1)}
                            </td>
                            <td className="py-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-red-200 rounded-full h-2">
                                  <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: ((user.churn_risk_score || 0.5) * 100) + '%' }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium text-gray-700">
                                  {((user.churn_risk_score || 0.5) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2">
                              {getRiskBadge(user.risk_level)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {segment.users.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        还有 {segment.users.length - 10} 个用户...
                      </p>
                    )}
                  </div>
                </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">所有用户群体</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="segment-card bg-gray-50 border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-300"
              onClick={() => setExpandedSegment(expandedSegment === segment.id ? null : segment.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getSegmentIcon(segment.id)}</span>
                  <h4 className="font-medium text-gray-900">{segment.name}</h4>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{segment.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <p className="text-xl font-bold text-gray-900">{segment.users?.length || 0}</p>
                  <p className="text-xs text-gray-500">用户</p>
                </div>
                {getRiskBadge(segment.risk_level)}
              </div>

              {expandedSegment === segment.id && segment.users && segment.users.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {segment.users.slice(0, 5).map((user, userIndex) => (
                      <div key={userIndex} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                        <span className="font-mono text-xs text-gray-600 truncate max-w-32">
                          {user.customer_id || user.email || '用户' + (userIndex + 1)}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          风险: {((user.churn_risk_score || 0.5) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                    {segment.users.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        ...还有 {segment.users.length - 5} 个用户
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-medium text-blue-900 mb-2">用户分群说明</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="text-lg">💰</span>
            <div>
              <p className="font-medium">高价值高风险用户</p>
              <p className="text-blue-600">高收入贡献大但流失风险高，优先挽留</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-lg">😴</span>
            <div>
              <p className="font-medium">沉默用户</p>
              <p className="text-blue-600">超过60天未活跃，需要重新激活</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-lg">💳</span>
            <div>
              <p className="font-medium">支付问题用户</p>
              <p className="text-blue-600">连续支付失败，可能导致流失</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-lg">🎫</span>
            <div>
              <p className="font-medium">高频支持用户</p>
              <p className="text-blue-600">大量工单，可能存在不满</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSegmentation
