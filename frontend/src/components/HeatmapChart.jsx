import React from 'react'

function HeatmapChart({ data, labels }) {
  if (!data || !labels) return null

  const xLabels = labels.x || ['0-25%', '25-50%', '50-75%', '75-100%']
  const yLabels = labels.y || ['0-25%', '25-50%', '50-75%', '75-100%']

  const getRiskColor = (value) => {
    if (value < 0.2) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
    if (value < 0.4) return { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-300' }
    if (value < 0.6) return { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-300' }
    if (value < 0.8) return { bg: 'bg-orange-300', text: 'text-orange-900', border: 'border-orange-400' }
    return { bg: 'bg-red-400', text: 'text-white', border: 'border-red-500' }
  }

  const getRiskLevel = (value) => {
    if (value < 0.2) return '低风险'
    if (value < 0.4) return '较低风险'
    if (value < 0.6) return '中等风险'
    if (value < 0.8) return '高风险'
    return '极高风险'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">流失风险热力图</h2>
          <p className="text-sm text-gray-500 mt-1">
            横轴：用户活跃度 | 纵轴：账单健康状态
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-6">
        <div className="flex-1">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-24"></th>
                  {xLabels.map((label, index) => (
                    <th key={index} className="py-2 px-3 text-center text-sm font-medium text-gray-600">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yLabels.map((yLabel, yIndex) => (
                  <tr key={yIndex}>
                    <td className="py-2 px-3 text-sm font-medium text-gray-600 text-right">
                      {yLabel}
                    </td>
                    {xLabels.map((_, xIndex) => {
                      const value = data[yIndex]?.[xIndex] || 0
                      const colors = getRiskColor(value)
                      return (
                        <td key={xIndex} className="py-2 px-3">
                          <div
                            className={`w-full aspect-square rounded-lg border ${colors.bg} ${colors.border} heatmap-cell flex items-center justify-center cursor-pointer relative group`}
                            title={`风险分数: ${(value * 100).toFixed(1)}%\n${getRiskLevel(value)}`}
                          >
                            <span className={`text-xs font-semibold ${colors.text}`}>
                              {(value * 100).toFixed(0)}
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              <p className="font-medium">{getRiskLevel(value)}</p>
                              <p className="text-gray-300">风险分数: {(value * 100).toFixed(1)}%</p>
                              <p className="text-gray-400 mt-1">
                                活跃度: {xLabels[xIndex]} | 账单健康: {yLabels[yIndex]}
                              </p>
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <p className="text-xs text-gray-500 font-medium">风险等级</p>
          {[
            { value: 0.1, label: '低风险' },
            { value: 0.3, label: '较低' },
            { value: 0.5, label: '中等' },
            { value: 0.7, label: '高风险' },
            { value: 0.9, label: '极高' }
          ].map((item, index) => {
            const colors = getRiskColor(item.value)
            return (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded ${colors.bg} ${colors.border} border`}></div>
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">如何解读此热力图</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <span className="font-medium">横轴（用户活跃度）</span>：从左到右表示活跃度从低到高</li>
          <li>• <span className="font-medium">纵轴（账单健康状态）</span>：从下到上表示账单健康从差到好</li>
          <li>• <span className="font-medium">红色区域</span>：高流失风险区域，需要立即关注</li>
          <li>• <span className="font-medium">绿色区域</span>：低风险区域，用户状态良好</li>
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔴</span>
            <div>
              <p className="text-sm font-medium text-red-900">危险区域</p>
              <p className="text-xs text-red-700">低活跃度 + 差账单健康</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🟡</span>
            <div>
              <p className="text-sm font-medium text-yellow-900">警告区域</p>
              <p className="text-xs text-yellow-700">中等活跃度或账单问题</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🟢</span>
            <div>
              <p className="text-sm font-medium text-green-900">安全区域</p>
              <p className="text-xs text-green-700">高活跃度 + 良好账单健康</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeatmapChart
