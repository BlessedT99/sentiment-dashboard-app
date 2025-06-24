import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { MessageSquare, TrendingUp, TrendingDown, Minus, RefreshCw, Upload, Download, Globe, Brain } from 'lucide-react';

const SentimentDashboard = () => {
  const [texts, setTexts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [apiKey, setApiKey] = useState('');
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [error, setError] = useState('');

  // Hugging Face API configuration
  const HF_MODEL = 'tabularisai/multilingual-sentiment-analysis';
  const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

  // Initialize with sample data for demonstration
  useEffect(() => {
    const sampleTexts = [
      "I absolutely love this new product! It's amazing and works perfectly.",
      "El servicio fue excelente, muy recomendable.",
      "Terrible experience, would not recommend to anyone.",
      "Ce produit est fantastique, je le recommande vivement!",
      "普通的产品，没什么特别的。",
      "Отличное качество и быстрая доставка!",
      "The quality is disappointing and overpriced."
    ];

    // For demo purposes, we'll use simulated results
    const initialData = sampleTexts.map((text, index) => ({
      id: index + 1,
      text,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      sentiment: ['positive', 'positive', 'negative', 'positive', 'neutral', 'positive', 'negative'][index],
      confidence: [0.92, 0.88, 0.94, 0.87, 0.76, 0.91, 0.89][index],
      scores: {
        positive: [0.92, 0.88, 0.06, 0.87, 0.24, 0.91, 0.11][index],
        neutral: [0.06, 0.10, 0.12, 0.11, 0.76, 0.07, 0.15][index],
        negative: [0.02, 0.02, 0.82, 0.02, 0.00, 0.02, 0.74][index]
      }
    }));
    setTexts(initialData);
  }, []);

  // Hugging Face API call
  const analyzeWithHuggingFace = async (text) => {
    if (!apiKey) {
      throw new Error('Please set your Hugging Face API key');
    }

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  };

  // Process Hugging Face response
  const processHuggingFaceResponse = (apiResponse) => {
    if (!apiResponse || !Array.isArray(apiResponse) || apiResponse.length === 0) {
      throw new Error('Invalid API response format');
    }

    const scores = apiResponse[0];
    const sentimentMap = {
      'POSITIVE': 'positive',
      'NEGATIVE': 'negative',
      'NEUTRAL': 'neutral'
    };

    // Find the highest scoring sentiment
    const topSentiment = scores.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    );

    const sentiment = sentimentMap[topSentiment.label] || 'neutral';
    const confidence = topSentiment.score;

    // Create scores object
    const processedScores = {
      positive: scores.find(s => s.label === 'POSITIVE')?.score || 0,
      negative: scores.find(s => s.label === 'NEGATIVE')?.score || 0,
      neutral: scores.find(s => s.label === 'NEUTRAL')?.score || 0
    };

    return {
      sentiment,
      confidence,
      scores: processedScores
    };
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setError('');

    try {
      let analysis;
      
      if (apiKey) {
        // Use Hugging Face API
        const apiResponse = await analyzeWithHuggingFace(inputText);
        analysis = processHuggingFaceResponse(apiResponse);
      } else {
        // Fallback to simple analysis for demo
        analysis = {
          sentiment: 'neutral',
          confidence: 0.75,
          scores: { positive: 0.3, neutral: 0.5, negative: 0.2 }
        };
      }

      const newText = {
        id: texts.length + 1,
        text: inputText,
        timestamp: new Date(),
        ...analysis
      };

      setTexts([newText, ...texts]);
      setInputText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
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
    neutral: texts.filter(t => t.sentiment === 'neutral').length,
    avgConfidence: texts.length > 0 ? (texts.reduce((sum, t) => sum + t.confidence, 0) / texts.length) : 0
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Brain className="w-10 h-10 text-blue-600" />
            AI Multilingual Sentiment Dashboard
          </h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" />
            Powered by Hugging Face tabularisai/multilingual-sentiment-analysis
          </p>
        </div>

        {/* API Setup Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Model Configuration
            </h2>
            <button
              onClick={() => setShowApiSetup(!showApiSetup)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showApiSetup ? 'Hide Setup' : 'Configure API'}
            </button>
          </div>

          {showApiSetup && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hugging Face API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Hugging Face API key"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your free API key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Hugging Face</a>
                </p>
              </div>
              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                <strong>Model:</strong> tabularisai/multilingual-sentiment-analysis<br/>
                <strong>Languages:</strong> English, Spanish, French, German, Chinese, Russian, and more<br/>
                <strong>Output:</strong> POSITIVE, NEGATIVE, NEUTRAL with confidence scores
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${apiKey ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {apiKey ? 'AI Model Connected' : 'Using Demo Mode (Configure API for real analysis)'}
            </span>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Analyze Text (Any Language)
          </h2>
          <div className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text in any language to analyze sentiment... 
例如：这个产品很棒！
Por ejemplo: ¡Este producto es increíble!
Например: Этот продукт потрясающий!"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={!inputText.trim() || isAnalyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {isAnalyzing ? 'Analyzing with AI...' : 'Analyze with AI'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-3xl font-bold text-purple-600">{(stats.avgConfidence * 100).toFixed(0)}%</p>
              </div>
              <Brain className="w-8 h-8 text-purple-600" />
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
            <h3 className="text-lg font-semibold">AI Analysis Results</h3>
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
                      ({(text.confidence * 100).toFixed(1)}% confidence)
                    </span>
                  </div>
                  <span className="text-xs opacity-75">
                    {text.timestamp.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-800 mb-2">{text.text}</p>
                {text.scores && (
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600">Pos: {(text.scores.positive * 100).toFixed(1)}%</span>
                    <span className="text-gray-600">Neu: {(text.scores.neutral * 100).toFixed(1)}%</span>
                    <span className="text-red-600">Neg: {(text.scores.negative * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentDashboard;