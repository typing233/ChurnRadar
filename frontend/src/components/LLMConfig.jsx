import React, { useState } from 'react'
import axios from 'axios'

function LLMConfig() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    base_url: '',
    api_key: '',
    model_name: 'gpt-3.5-turbo'
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleTest = async () => {
    if (!config.base_url || !config.api_key) {
      setTestResult({
        success: false,
        message: '请填写API地址和API密钥'
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await axios.post('/api/test-llm', {
        base_url: config.base_url,
        api_key: config.api_key,
        model_name: config.model_name
      })
      setTestResult(response.data)
    } catch (error) {
      setTestResult({
        success: false,
        message: '连接测试失败',
        details: error.response?.data?.detail || error.message
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (config.base_url && config.api_key) {
      localStorage.setItem('llm_config', JSON.stringify(config))
      setTestResult({
        success: true,
        message: '配置已保存到本地'
      })
    }
  }

  React.useEffect(() => {
    const saved = localStorage.getItem('llm_config')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch {}
    }
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>LLM配置</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 p-6 z-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">LLM API 配置</h3>
            <p className="text-sm text-gray-500 mb-4">
              配置OpenAI兼容的API接口，用于高级分析功能
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Base URL
                </label>
                <input
                  type="url"
                  value={config.base_url}
                  onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  支持OpenAI兼容的API端点
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={config.model_name}
                  onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
                  placeholder="gpt-3.5-turbo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {testResult && (
              <div className={`mt-4 p-3 rounded-lg ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? '✓ ' : '✗ '}{testResult.message}
                </p>
                {testResult.details && (
                  <p className="text-xs text-gray-600 mt-1">{testResult.details}</p>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                保存配置
              </button>
              <button
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {testing ? (
                  <>
                    <div className="loading-spinner w-4 h-4"></div>
                    <span>测试中...</span>
                  </>
                ) : (
                  <span>测试连接</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LLMConfig
