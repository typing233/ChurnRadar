import React, { useState } from 'react'
import axios from 'axios'

function HighRiskUsers({ users, taskId }) {
  const [exporting, setExporting] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('churn_risk_score')
  const [sortOrder, setSortOrder] = useState('desc')

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🎉</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">没有高危用户</h3>
          <p className="text-gray-500">您的用户流失风险控制得很好！</p>
        </div>
      </div>
    )
  }

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
      alert('导出失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setExporting(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.risk_level === filter
    const matchesSearch = !searchTerm || 
      (user.customer_id && user.customer_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.customer_name && user.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aVal = a[sortBy] || 0
    const bVal = b[sortBy] || 0
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const getRiskBadge = (riskLevel) => {
    const styles = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
    const labels = {
      critical: '极高风险',
      high: '高风险',
      medium: '中等风险',
      low: '低风险'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[riskLevel] || styles.medium}`}>
        {labels[riskLevel] || '中等风险'}
      </span>
    )
  }

  const getRiskBarColor = (score) => {
    if (score >= 0.8) return 'bg-red-500'
    if (score >= 0.6) return 'bg-orange-500'
    if (score >= 0.4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const criticalCount = users.filter(u => u.risk_level === 'critical').length
  const highCount = users.filter(u => u.risk_level === 'high').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-red-200 p-5 card-hover">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔴</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-sm text-gray-600">极高风险用户</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-5 card-hover">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🟠</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600">{highCount}</p>
              <p className="text-sm text-gray-600">高风险用户</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-600">高危用户总数</p>
              </div>
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
                  <span>全部导出</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">高危用户列表</h2>
            <p className="text-sm text-gray-500 mt-1">
              共找到 {sortedUsers.length} 个高危用户
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索用户ID、邮箱..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部风险等级</option>
              <option value="critical">仅极高风险</option>
              <option value="high">仅高风险</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('customer_id')}
                >
                  <div className="flex items-center space-x-1">
                    <span>用户ID</span>
                    {sortBy === 'customer_id' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('churn_risk_score')}
                >
                  <div className="flex items-center space-x-1">
                    <span>流失风险</span>
                    {sortBy === 'churn_risk_score' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">风险等级</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">活跃度</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">支付状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">工单风险</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">月收入</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-0 table-row-hover">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900 font-mono text-xs">
                        {user.customer_id || user.email || `用户${index + 1}`}
                      </p>
                      {user.email && (
                        <p className="text-xs text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getRiskBarColor(user.churn_risk_score || 0.5)}`}
                          style={{ width: `${Math.min((user.churn_risk_score || 0.5) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {((user.churn_risk_score || 0.5) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getRiskBadge(user.risk_level)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        (user.activity_score || 0.5) > 0.7 ? 'bg-green-500' :
                        (user.activity_score || 0.5) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-gray-600">
                        {((user.activity_score || 0.5) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        (user.payment_health_score || 1) > 0.7 ? 'bg-green-500' :
                        (user.payment_health_score || 1) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-gray-600 text-sm">
                        {user.payment_status || '健康'}
                      </span>
                    </div>
                    {(user.consecutive_failures || 0) > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        连续{user.consecutive_failures}次扣款失败
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        (user.ticket_risk_score || 0) > 0.6 ? 'bg-red-500' :
                        (user.ticket_risk_score || 0) > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-gray-600">
                        {((user.ticket_risk_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {user.monthly_revenue ? (
                      <span className="font-medium text-gray-900">
                        ${user.monthly_revenue.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedUsers.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🔍</span>
            <p className="text-gray-500">没有找到匹配的用户</p>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
        <h3 className="text-sm font-medium text-yellow-900 mb-3 flex items-center space-x-2">
          <span className="text-lg">💡</span>
          <span>运营建议</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="font-medium mb-1">🔴 极高风险用户</p>
            <p className="text-yellow-700">立即联系，了解流失原因，提供专属优惠</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="font-medium mb-1">🟠 高风险用户</p>
            <p className="text-yellow-700">主动回访，收集反馈，优化产品体验</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="font-medium mb-1">💳 支付问题用户</p>
            <p className="text-yellow-700">检查支付状态，协助用户更新支付方式</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="font-medium mb-1">🎫 工单频繁用户</p>
            <p className="text-yellow-700">优先处理工单，安排专属客服跟进</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HighRiskUsers
