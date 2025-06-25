import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { MessageSquare, TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, Settings, Trash2, Server } from 'lucide-react';

const SentimentDashboard = () => {
  const [texts, setTexts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  
  // Backend API URL - your deployed Render backend
  const API_BASE_URL = 'https://sentiment-dashboard-app.onrender.com/api';
  
  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
    loadHistory();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('error');
    }
  };

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTexts(data.history || []);
      } else {
        console.error('Failed to load history:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      // Don't show error for history loading failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add the new analysis to the front of the list
      setTexts(prevTexts => [data.analysis, ...prevTexts]);
      setInputText('');
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze sentiment. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteAnalysis = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setTexts(prevTexts => prevTexts.filter(text => text.id !== id));
      } else {
        console.error('Failed to delete analysis');
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const clearAll = async () => {
    if (window.confirm('Are you sure you want to delete all analyses?')) {
      // Delete all analyses one by one (since there's no bulk delete endpoint)
      const deletePromises = texts.map(text => deleteAnalysis(text.id));
      await Promise.all(deletePromises);
    }
  };

  const filteredTexts = texts.filter(text => 
    filter === 'all' || text.sentiment === filter
  );

  // Calculate statistics
  const stats = {
    total: texts.length,
    positive: texts.filter(t => t.sentiment === 'positive').length,
    negative: texts.filter(t => t.sentiment === 'negative').length,
    neutral: texts.filter(t => t.sentiment === 'neutral').length
  };

  // Prepare chart data
  const sentimentChartData = [
    { name: 'Positive', value: stats.positive, color: '#10B981' },
    { name: 'Neutral', value: stats.neutral, color: '#6B7280' },
    { name: 'Negative', value: stats.negative, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const timeSeriesData = texts
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((text, index) => ({
      index: index + 1,
      positive: texts.slice(0, index + 1).filter(t => t.sentiment === 'positive').length,
      negative: texts.slice(0, index + 1).filter(t => t.sentiment === 'negative').length,
      neutral: texts.slice(0, index + 1).filter(t => t.sentiment === 'neutral').length
    }));

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getBackendStatusInfo = () => {
    switch (backendStatus) {
      case 'connected':
        return { color: 'bg-green-400', text: 'Backend Connected', icon: '✓' };
      case 'error':
        return { color: 'bg-red-400', text: 'Backend Offline', icon: '✗' };
      default:
        return { color: 'bg-yellow-400', text: 'Checking...', icon: '⟳' };
    }
  };

  const statusInfo = getBackendStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sentiment Analysis Dashboard</h1>
          <p className="text-gray-600">Analyze text sentiment with AI-powered analysis</p>
        </div>

        {/* Backend Status */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                <Server className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">{statusInfo.text}</span>
              </div>
              <span className="text-xs text-gray-500">
                API: {API_BASE_URL}
              </span>
            </div>
            <button
              onClick={checkBackendHealth}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">Error:</span>
              <span className="text-red-600">{error}</span>
            </div>
          </div>
        )}

        {/* Backend Offline Warning */}
        {backendStatus === 'error' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-700 font-medium">Backend Offline:</span>
              <span className="text-yellow-600">
                The backend server is not responding. Please check if the Render service is running.
              </span>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Analyze New Text
          </h2>
          <div className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to analyze sentiment... Try phrases like 'I love this product!', 'This is terrible service.', or 'I feel neutral about this movie.'"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleAnalyze();
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={!inputText.trim() || isAnalyzing || backendStatus !== 'connected'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
              </button>
              {texts.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={loadHistory}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh History
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Tip: Press Ctrl+Enter to analyze quickly
              {backendStatus !== 'connected' && ' (Backend connection required)'}
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyzed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Positive</p>
                <p className="text-3xl font-bold text-green-600">{stats.positive}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? `${((stats.positive / stats.total) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Neutral</p>
                <p className="text-3xl font-bold text-gray-600">{stats.neutral}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? `${((stats.neutral / stats.total) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
              <Minus className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Negative</p>
                <p className="text-3xl font-bold text-red-600">{stats.negative}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? `${((stats.negative / stats.total) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {texts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
              {sentimentChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sentimentChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                    {sentimentChartData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No data to display
                </div>
              )}
            </div>

            {/* Trend Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Sentiment Trends</h3>
              {timeSeriesData.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="positive" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="neutral" stackId="1" stroke="#6B7280" fill="#6B7280" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="negative" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Add more analyses to see trends
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All ({texts.length})</option>
                <option value="positive">Positive ({stats.positive})</option>
                <option value="neutral">Neutral ({stats.neutral})</option>
                <option value="negative">Negative ({stats.negative})</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading history...</span>
              </div>
            ) : filteredTexts.length > 0 ? (
              filteredTexts.map((text) => (
                <div key={text.id} className={`p-4 rounded-lg border ${getSentimentColor(text.sentiment)}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(text.sentiment)}
                      <span className="font-semibold capitalize">{text.sentiment}</span>
                      <span className="text-sm opacity-75">
                        ({((text.confidence || 0.5) * 100).toFixed(0)}% confidence)
                      </span>
                      {text.score !== undefined && (
                        <span className="text-xs opacity-60">
                          Score: {text.score.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-75">
                        {new Date(text.timestamp).toLocaleString()}
                      </span>
                      <button
                        onClick={() => deleteAnalysis(text.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete analysis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{text.text}</p>
                </div>
              ))
            ) : texts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h4 className="text-lg font-medium mb-2">No analyses yet</h4>
                <p>Start by entering some text above to analyze its sentiment!</p>
                <p className="text-sm mt-2">Try examples like:</p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {[
                    "I love this product!",
                    "This service is terrible.",
                    "It's okay, nothing special.",
                    "I feel neutral about this movie.",
                    "I'm not sure how I feel about this."
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(example)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No {filter} sentiment analyses found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentDashboard;