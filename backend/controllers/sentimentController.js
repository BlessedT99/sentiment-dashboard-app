const axios = require('axios');

// In-memory storage (replace with database later)
let analysisHistory = [];
let idCounter = 1;

const analyzeSentimentWithAPIs = async (text) => {
  const apis = [
    {
      name: 'MeaningCloud',
      analyze: async (text) => {
        const response = await axios.post(
          'https://api.meaningcloud.com/sentiment-2.1',
          new URLSearchParams({
            key: process.env.MEANINGCLOUD_API_KEY,
            txt: text,
            lang: 'en'
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        const score = parseFloat(response.data.score_tag);
        let sentiment = 'neutral';
        if (score > 0.1) sentiment = 'positive';
        else if (score < -0.1) sentiment = 'negative';
        
        return {
          sentiment,
          score,
          confidence: parseFloat(response.data.confidence) / 100,
          source: 'MeaningCloud'
        };
      }
    },
    {
      name: 'Hugging Face',
      analyze: async (text) => {
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
          { inputs: text },
          {
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const results = response.data[0];
        const positive = results.find(r => r.label === 'LABEL_2')?.score || 0;
        const negative = results.find(r => r.label === 'LABEL_0')?.score || 0;
        const neutral = results.find(r => r.label === 'LABEL_1')?.score || 0;
        
        let sentiment = 'neutral';
        let confidence = neutral;
        if (positive > negative && positive > neutral) {
          sentiment = 'positive';
          confidence = positive;
        } else if (negative > positive && negative > neutral) {
          sentiment = 'negative';
          confidence = negative;
        }
        
        return {
          sentiment,
          score: positive - negative,
          confidence,
          source: 'Hugging Face'
        };
      }
    }
  ];

  // Try APIs in sequence
  for (const api of apis) {
    try {
      return await api.analyze(text);
    } catch (error) {
      console.warn(`${api.name} API failed:`, error.message);
      continue;
    }
  }

  // Fallback to local analysis
  return localSentimentAnalysis(text);
};

const localSentimentAnalysis = (text) => {
  const positiveWords = ['love', 'amazing', 'great', 'excellent', 'fantastic', 'wonderful', 'awesome', 'perfect', 'good', 'helpful', 'friendly', 'easy', 'best', 'outstanding', 'brilliant', 'superb'];
  const negativeWords = ['hate', 'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing', 'overpriced', 'poor', 'useless', 'disgusting', 'pathetic', 'annoying', 'frustrating'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pos => word.includes(pos))) score += 1;
    if (negativeWords.some(neg => word.includes(neg))) score -= 1;
  });
  
  let sentiment = 'neutral';
  let confidence = 0.6;
  
  if (score > 0) {
    sentiment = 'positive';
    confidence = Math.min(score * 0.25 + 0.5, 0.95);
  } else if (score < 0) {
    sentiment = 'negative';
    confidence = Math.min(Math.abs(score) * 0.25 + 0.5, 0.95);
  }
  
  return { sentiment, score, confidence, source: 'Local Analysis' };
};

// Controller functions
const analyzeSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const analysis = await analyzeSentimentWithAPIs(text);
    
    // Store in history
    const result = {
      id: idCounter++,
      text,
      ...analysis,
      timestamp: new Date().toISOString()
    };
    
    analysisHistory.unshift(result);
    
    // Keep only last 100 results
    if (analysisHistory.length > 100) {
      analysisHistory = analysisHistory.slice(0, 100);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
};

const getHistory = (req, res) => {
  const { limit = 50, filter } = req.query;
  
  let filteredHistory = analysisHistory;
  
  if (filter && filter !== 'all') {
    filteredHistory = analysisHistory.filter(item => item.sentiment === filter);
  }
  
  res.json(filteredHistory.slice(0, parseInt(limit)));
};

const deleteAnalysis = (req, res) => {
  const { id } = req.params;
  const index = analysisHistory.findIndex(item => item.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  
  analysisHistory.splice(index, 1);
  res.json({ message: 'Analysis deleted successfully' });
};

const getStats = (req, res) => {
  const stats = {
    total: analysisHistory.length,
    positive: analysisHistory.filter(item => item.sentiment === 'positive').length,
    negative: analysisHistory.filter(item => item.sentiment === 'negative').length,
    neutral: analysisHistory.filter(item => item.sentiment === 'neutral').length,
    averageConfidence: analysisHistory.reduce((sum, item) => sum + item.confidence, 0) / analysisHistory.length || 0
  };
  
  res.json(stats);
};

module.exports = {
  analyzeSentiment,
  getHistory,
  deleteAnalysis,
  getStats
};