import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { MessageSquare, TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, Settings } from 'lucide-react';

const SentimentDashboard = () => {
  const [texts, setTexts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('092e68e94bmsh00ba7d06f260e4cp1746b0jsn934a7cb11fec'); // Your API key
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Custom function to classify sentiment based on score with neutral threshold
  const classifySentimentByScore = (score) => {
    const neutralThreshold = 0.3;
    
    if (score >= -neutralThreshold && score <= neutralThreshold) {
      return 'neutral';
    } else if (score > neutralThreshold) {
      return 'positive';
    } else {
      return 'negative';
    }
  };

  // Enhanced fallback sentiment analysis with better neutral detection
  const analyzeSentimentFallback = (text) => {
    // Expanded word lists with intensity scores
    const positiveWords = {
      // Strong positive (weight: 2)
      'amazing': 2, 'fantastic': 2, 'excellent': 2, 'outstanding': 2, 'spectacular': 2,
      'incredible': 2, 'wonderful': 2, 'brilliant': 2, 'superb': 2, 'phenomenal': 2,
      'marvelous': 2, 'magnificent': 2, 'exceptional': 2, 'terrific': 2, 'fabulous': 2,
      'perfect': 2, 'awesome': 2, 'love': 2,
      // Moderate positive (weight: 1.5)
      'great': 1.5, 'good': 1.5, 'nice': 1.5, 'pleasant': 1.5, 'satisfied': 1.5,
      'happy': 1.5, 'delighted': 1.5, 'impressed': 1.5, 'beautiful': 1.5, 'lovely': 1.5,
      'enjoy': 1.5, 'helpful': 1.5, 'friendly': 1.5,
      // Mild positive (weight: 1)
      'like': 1, 'easy': 1, 'recommend': 1, 'decent': 1, 'fine': 1, 'pretty': 1,
      'okay': 0.5, 'ok': 0.5, 'alright': 0.5, 'fair': 0.5
    };
    
    const negativeWords = {
      // Strong negative (weight: -2)
      'terrible': -2, 'awful': -2, 'horrible': -2, 'disgusting': -2, 'pathetic': -2,
      'dreadful': -2, 'appalling': -2, 'atrocious': -2, 'abysmal': -2, 'catastrophic': -2,
      'hate': -2, 'worst': -2,
      // Moderate negative (weight: -1.5)
      'bad': -1.5, 'poor': -1.5, 'disappointing': -1.5, 'frustrating': -1.5, 'annoying': -1.5,
      'useless': -1.5, 'waste': -1.5, 'broken': -1.5, 'ridiculous': -1.5, 'stupid': -1.5,
      'overpriced': -1.5, 'boring': -1.5, 'confusing': -1.5, 'crappy': -1.5, 'garbage': -1.5,
      // Mild negative (weight: -1)
      'dislike': -1, 'slow': -1, 'unhelpful': -1, 'rude': -1, 'inadequate': -1, 
      'inferior': -1, 'buggy': -1, 'irritating': -1, 'mediocre': -0.5
    };
    
    // Neutral indicators - words that suggest neutrality or uncertainty
    const neutralIndicators = [
      'neutral', 'unsure', 'uncertain', 'maybe', 'perhaps', 'somewhat', 'kind of',
      'sort of', 'not sure', 'undecided', 'mixed', 'average', 'moderate', 'typical',
      'standard', 'regular', 'normal', 'usual', 'ordinary', 'so-so', 'meh',
      'nothing special', 'not bad', 'not good', 'could be better', 'could be worse'
    ];
    
    // Context modifiers
    const negationWords = ['not', 'no', 'never', 'nothing', 'nowhere', 'neither', 'nobody', 'none', 'hardly', 'barely'];
    const intensifiers = ['very', 'extremely', 'really', 'quite', 'pretty', 'rather', 'totally', 'completely', 'absolutely', 'definitely'];
    const diminishers = ['slightly', 'somewhat', 'a bit', 'a little', 'kind of', 'sort of', 'rather', 'fairly'];
    
    // Clean and tokenize text
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    let totalScore = 0;
    let wordCount = 0;
    let neutralCount = 0;
    let sentimentWordCount = 0;
    
    // Check for multi-word neutral phrases first
    const fullText = cleanText;
    neutralIndicators.forEach(phrase => {
      if (fullText.includes(phrase)) {
        neutralCount += phrase.split(' ').length;
      }
    });
    
    // Analyze each word with context
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check for neutral indicators
      if (neutralIndicators.includes(word)) {
        neutralCount += 1;
        continue;
      }
      
      // Check for sentiment words
      let wordScore = 0;
      
      if (positiveWords[word]) {
        wordScore = positiveWords[word];
        sentimentWordCount++;
      } else if (negativeWords[word]) {
        wordScore = negativeWords[word];
        sentimentWordCount++;
      } else {
        // Check for partial matches (substring matching)
        for (const [posWord, score] of Object.entries(positiveWords)) {
          if (word.includes(posWord) || posWord.includes(word)) {
            wordScore = Math.max(wordScore, score * 0.7); // Reduce score for partial matches
            sentimentWordCount++;
            break;
          }
        }
        
        if (wordScore === 0) {
          for (const [negWord, score] of Object.entries(negativeWords)) {
            if (word.includes(negWord) || negWord.includes(word)) {
              wordScore = Math.min(wordScore, score * 0.7);
              sentimentWordCount++;
              break;
            }
          }
        }
      }
      
      if (wordScore !== 0) {
        // Apply context modifiers
        let modifier = 1;
        
        // Check for negation in the previous 2 words
        for (let j = Math.max(0, i - 2); j < i; j++) {
          if (negationWords.includes(words[j])) {
            modifier *= -0.8; // Flip and reduce intensity
            break;
          }
        }
        
        // Check for intensifiers/diminishers in the previous 2 words
        for (let j = Math.max(0, i - 2); j < i; j++) {
          if (intensifiers.includes(words[j])) {
            modifier *= 1.3;
            break;
          } else if (diminishers.includes(words[j])) {
            modifier *= 0.6;
            break;
          }
        }
        
        totalScore += wordScore * modifier;
        wordCount++;
      }
    }
    
    // Calculate confidence based on various factors
    const textLength = words.length;
    const sentimentDensity = sentimentWordCount / Math.max(textLength, 1);
    const neutralDensity = neutralCount / Math.max(textLength, 1);
    
    // Normalize score by text length (avoid bias toward longer texts)
    const normalizedScore = wordCount > 0 ? totalScore / Math.sqrt(wordCount) : 0;
    
    // Use the same neutral threshold as API
    const sentiment = classifySentimentByScore(normalizedScore);
    
    // Calculate confidence
    let confidence;
    if (neutralCount > 0 && Math.abs(normalizedScore) < 0.3) {
      confidence = Math.min(0.7 + neutralDensity, 0.9);
    } else if (Math.abs(normalizedScore) < 0.3) {
      confidence = Math.max(0.5, 0.8 - Math.abs(normalizedScore));
    } else {
      confidence = Math.min(0.6 + Math.abs(normalizedScore) * 0.2 + sentimentDensity, 0.95);
    }
    
    // Adjust confidence based on text characteristics
    if (textLength < 3) {
      confidence *= 0.8;
    } else if (textLength > 20) {
      confidence *= 1.1;
      confidence = Math.min(confidence, 0.95);
    }
    
    return {
      sentiment,
      score: normalizedScore,
      confidence: Math.max(0.3, Math.min(confidence, 0.95))
    };
  };

  // RapidAPI Sentiment Analysis function with custom neutral threshold
  const analyzeSentimentAPI = async (text) => {
    if (!apiKey.trim()) {
      throw new Error('API key is required');
    }

    try {
      const response = await fetch(
        `https://twinword-sentiment-analysis.p.rapidapi.com/analyze/?text=${encodeURIComponent(text)}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': apiKey.trim(),
            'X-RapidAPI-Host': 'twinword-sentiment-analysis.p.rapidapi.com'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Invalid API key or insufficient permissions');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Try again later.');
        } else {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Get the original API response
      const apiScore = data.score || 0;
      const originalApiSentiment = data.type || 'neutral';
      const apiConfidence = Math.abs(data.ratio || 0.5);
      
      // Apply custom neutral threshold logic - this is the key part!
      const customSentiment = classifySentimentByScore(apiScore);
      
      return {
        sentiment: customSentiment,
        score: apiScore,
        confidence: apiConfidence,
        apiResponse: data,
        originalApiSentiment: originalApiSentiment // Keep track of what the API originally said
      };
    } catch (fetchError) {
      // If it's a network error, provide more context
      if (fetchError.name === 'TypeError') {
        throw new Error('Network error - check your internet connection');
      }
      throw fetchError;
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
      let analysis;
      
      if (apiKey.trim()) {
        analysis = await analyzeSentimentAPI(inputText);
      } else {
        analysis = analyzeSentimentFallback(inputText);
      }
      
      const newText = {
        id: Date.now(),
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

  const clearAll = () => {
    setTexts([]);
    setError('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sentiment Analysis Dashboard</h1>
          <p className="text-gray-600">Analyze text sentiment with AI-powered analysis</p>
        </div>

        {/* API Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${apiKey ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                <span className="text-sm font-medium">
                  {apiKey ? 'Using RapidAPI (Twinword Sentiment Analysis)' : 'Using Enhanced Demo Mode'}
                </span>
              </div>
              {!apiKey && (
                <button
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Settings className="w-4 h-4" />
                  Setup API
                </button>
              )}
            </div>
            {apiKey && (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                API Key Active
              </div>
            )}
          </div>
          
          {showApiKeyInput && !apiKey && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter RapidAPI Key"
                  className="w-full p-2 border border-gray-300 rounded"
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">Get your API key from RapidAPI:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Visit RapidAPI and subscribe to Twinword Sentiment Analysis</li>
                    <li>Copy your API key</li>
                    <li>Paste it above</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
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
                disabled={!inputText.trim() || isAnalyzing}
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
            </div>
            <p className="text-xs text-gray-500">Tip: Press Ctrl+Enter to analyze quickly</p>
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
            {filteredTexts.map((text) => (
              <div key={text.id} className={`p-4 rounded-lg border ${getSentimentColor(text.sentiment)}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(text.sentiment)}
                    <span className="font-semibold capitalize">{text.sentiment}</span>
                    <span className="text-sm opacity-75">
                      ({(text.confidence * 100).toFixed(0)}% confidence)
                    </span>
                    {text.score !== undefined && (
                      <span className="text-xs opacity-60">
                        Score: {text.score.toFixed(2)}
                      </span>
                    )}
                    {text.originalApiSentiment && text.originalApiSentiment !== text.sentiment && (
                      <span className="text-xs opacity-50 bg-yellow-100 px-1 rounded">
                        API: {text.originalApiSentiment}
                      </span>
                    )}
                  </div>
                  <span className="text-xs opacity-75">
                    {text.timestamp.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed">{text.text}</p>
              </div>
            ))}
            {filteredTexts.length === 0 && texts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No analyses yet. Start by entering some text above!</p>
              </div>
            )}
            {filteredTexts.length === 0 && texts.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No results match the current filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentDashboard;