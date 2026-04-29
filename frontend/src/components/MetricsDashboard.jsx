import React from 'react'

function MetricsDashboard({ metrics, totalUsers }) {
  if (!metrics) return null

  const metricCards = [
    {
      label: '总用户数',
      value: totalUsers,
      icon: '👥',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-900'
    },
    {
      label: '平均流失风险',
      value: `${(metrics.avg_churn_risk * 100).toFixed(1)}%`,
      icon: '⚠️',
      color: metrics.avg_churn_risk > 0.5 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200',
      textColor: metrics.avg_churn_risk > 0.5 ? 'text-red-900' : 'text-green-900'
    },
    {
      label: '高危用户',
      value: metrics.critical_risk_count + metrics.high_risk_count,
      icon: '🔴',
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-900'
    },
    {
      label: '中危用户',
      value: metrics.medium_risk_count,
      icon: '🟡',
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-900'
    },
    {
      label: '低危用户',
      value: metrics.low_risk_count,
      icon: '🟢',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-900'
    }
  ]

  const issueCards = [
    {
      label: '沉默用户 (>60天未活跃)',
      value: metrics.silent_users_count,
      icon: '😴',
      description: '长时间未活跃，需要重新激活'
    },
    {
      label: '支付问题用户',
      value: metrics.payment_issues_count,
      icon: '💳',
      description: '支付健康分数低于70%'
    },
    {
      label: '高频工单用户',
      value: metrics.high_ticket_users_count,
      icon: '🎫',
      description: '近期提交大量支持工单'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">流失风险概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {metricCards.map((card, index) => (
            <div
              key={index}
              className={`rounded-xl border p-4 card-hover ${card.color}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{card.icon}</span>
              </div>
              <p className={`text-2xl font-bold mt-2 ${card.textColor}`}>
                {card.value}
              </p>
              <p className="text-sm text-gray-600 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">需要关注的问题</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {issueCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-5 card-hover"
            >
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl">{card.icon}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm font-medium text-gray-700">{card.label}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-3">风险分布</h3>
        <div className="flex items-center space-x-1 h-8">
          {[
            { count: metrics.low_risk_count, color: 'bg-green-500', label: '低危' },
            { count: metrics.medium_risk_count, color: 'bg-yellow-500', label: '中危' },
            { count: metrics.high_risk_count, color: 'bg-orange-500', label: '高危' },
            { count: metrics.critical_risk_count, color: 'bg-red-500', label: '极危' }
          ].map((item, index) => {
            const percentage = totalUsers > 0 ? (item.count / totalUsers) * 100 : 0
            if (percentage === 0) return null
            return (
              <div
                key={index}
                className={`h-full ${item.color} rounded-sm relative group cursor-pointer`}
                style={{ width: `${Math.max(percentage, 2)}%` }}
                title={`${item.label}: ${item.count}人 (${percentage.toFixed(1)}%)`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {item.label}: {item.count}人 ({percentage.toFixed(1)}%)
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span>低危</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
              <span>中危</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
              <span>高危</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span>极危</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsDashboard
