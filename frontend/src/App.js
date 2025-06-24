import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { MessageSquare, TrendingUp, TrendingDown, Minus, RefreshCw, Upload, Download } from 'lucide-react';

const SentimentDashboard = () => {
  const [texts, setTexts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Sample data for demonstration
  const sampleTexts = [
    "I absolutely love this new product! It's amazing and works perfectly.",
    "The service was okay, nothing special but not bad either.",
    "Terrible experience, would not recommend to anyone.",
    "Great customer support, very helpful and friendly staff.",
    "The quality is disappointing and overpriced.",
    "Fantastic features and easy to use interface.",
    "Average performance, meets basic expectations."
  ];

  // Simple sentiment analysis function
  const analyzeSentiment = (text) => {
    const positiveWords = [
    'love', 'amazing', 'great', 'excellent', 'fantastic', 'wonderful', 'awesome',
    'perfect', 'good', 'helpful', 'friendly', 'easy', 'enjoy', 'recommend',
    'superb', 'satisfied', 'delightful', 'impressed', 'outstanding', 'brilliant',
    'terrific', 'fabulous', 'nice', 'best', 'positive', 'fun', 'pleased', 'smooth',
    'fast', 'affordable', 'worthwhile', 'efficient', 'clean', 'neat', 'effective',
    'beautiful', 'cool', 'responsive', 'reliable', 'top-notch', 'comfortable',
    'well-done', 'kind', 'professional', 'timely', 'flexible', 'genius', 'awesome',
    'happy', 'lovely', 'grateful', 'enjoyable', 'respectful', 'stellar', 'safe'
    ];
    const negativeWords = [
    'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing',
    'overpriced', 'poor', 'useless', 'slow', 'unhelpful', 'rude', 'boring',
    'confusing', 'crappy', 'garbage', 'waste', 'broken', 'annoying', 'buggy',
    'negative', 'frustrating', 'painful', 'unreliable', 'laggy', 'difficult',
    'expensive', 'low-quality', 'incompetent', 'dirty', 'unprofessional',
    'unfriendly', 'late', 'mediocre', 'problematic', 'uncomfortable',
    'misleading', 'glitchy', 'inflexible', 'noisy', 'clunky', 'overwhelming',
    'ridiculous', 'terrifying', 'unsafe', 'inconvenient', 'not worth', 'regret',
    'failed', 'cheaply made'
    ];

    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) score += 1;
      if (negativeWords.some(neg => word.includes(neg))) score -= 1;
    });
    
    if (score > 0) return { sentiment: 'positive', score, confidence: Math.min(score * 0.3 + 0.4, 1) };
    if (score < 0) return { sentiment: 'negative', score, confidence: Math.min(Math.abs(score) * 0.3 + 0.4, 1) };
    return { sentiment: 'neutral', score: 0, confidence: 0.5 };
  };

  // Initialize with sample data
 /*seEffect(() => {
    const initialData = sampleTexts.map((text, index) => ({
      id: index + 1,
      text,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      ...analyzeSentiment(text)
    }));
    setTexts(initialData);
  }, []);*/

  const handleAnalyze = () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setTimeout(() => {
      const analysis = analyzeSentiment(inputText);
      const newText = {
        id: texts.length + 1,
        text: inputText,
        timestamp: new Date(),
        ...analysis
      };
      setTexts([newText, ...texts]);
      setInputText('');
      setIsAnalyzing(false);
    }, 1000);
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
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sentiment Analysis Dashboard</h1>
          <p className="text-gray-600">Analyze text sentiment in real-time with comprehensive insights</p>
        </div>

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
              placeholder="Enter text to analyze sentiment..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={!inputText.trim() || isAnalyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
              </button>
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

          {/* Trend Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Sentiment Trends</h3>
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
                  </div>
                  <span className="text-xs opacity-75">
                    {text.timestamp.toLocaleString()}
                  </span>
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