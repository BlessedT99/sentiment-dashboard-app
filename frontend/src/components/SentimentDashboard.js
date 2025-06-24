// Replace your current dashboard component with this version that uses the backend API
import React, { useState, useEffect } from 'react';
import { sentimentAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { MessageSquare, TrendingUp, TrendingDown, Minus, RefreshCw, Trash2 } from 'lucide-react';

const SentimentDashboard = () => {
  const [texts, setTexts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    averageConfidence: 0
  });
  const [error, setError] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await sentimentAPI.getHistory(100, filter);
      setTexts(response.data);
    } catch (error) {
      setError('Failed to load analysis history');
      console.error('Error loading history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await sentimentAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await sentimentAPI.analyze(inputText);
      setTexts(prev => [response.data, ...prev]);
      setInputText('');
      await loadStats(); // Refresh stats
    } catch (error) {
      setError('Failed to analyze sentiment. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await sentimentAPI.deleteAnalysis(id);
      setTexts(prev => prev.filter(text => text.id !== id));
      await loadStats(); // Refresh stats
    } catch (error) {
      setError('Failed to delete analysis');
      console.error('Delete error:', error);
    }
  };

  const filteredTexts = texts.filter(text => 
    filter === 'all' || text.sentiment === filter
  );

  // Prepare chart data
  const sentimentChartData = [
    { name: 'Positive', value: stats.positive, color: '#10B981' },
    { name: 'Neutral', value: stats.neutral, color: '#6B7280' },
    { name: 'Negative', value: stats.negative, color: '#EF4444' }
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI-Powered Sentiment Analysis Dashboard
          </h1>
          <p className="text-gray-600">
            Analyze text sentiment using advanced AI models with real-time insights
          </p>
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-2 inline-block">
            🚀 Backend-powered with MeaningCloud & Hugging Face APIs
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
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
              placeholder="Enter text to analyze sentiment using AI models..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 items-center">
              <button
                onClick={handleAnalyze}
                disabled={!inputText.trim() || isAnalyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {isAnalyzing ? 'Analyzing with AI...' : 'Analyze with AI'}
              </button>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Backend API powered
              </div>
            </div>
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
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Neutral</p>
                <p className="text-3xl font-bold text-gray-600">{stats.neutral}</p>
              </div>
              <Minus className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Negative</p>
                <p className="text-3xl font-bold text-red-600">{stats.negative}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
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
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Average Confidence */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Analysis Quality</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {(stats.averageConfidence * 100).toFixed(1)}%
              </div>
              <p className="text-gray-600">Average Confidence</p>
              <div className="mt-4 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${stats.averageConfidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

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
                <option value="all">All</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTexts.map((text) => (
              <div key={text.id} className={`p-4 rounded-lg border ${getSentimentColor(text.sentiment)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(text.sentiment)}
                    <span className="font-semibold capitalize">{text.sentiment}</span>
                    <span className="text-sm opacity-75">
                      ({(text.confidence * 100).toFixed(0)}% confidence)
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {text.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-75">
                      {new Date(text.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(text.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                      title="Delete analysis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-800">{text.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentDashboard;