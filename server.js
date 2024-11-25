const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets (like styles.css and images)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// Serve result page
app.get('/result', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'result.html'));
});

// POST endpoint to process the form
app.post('/style-now', async (req, res) => {
  const { age, gender, eventDescription, weather, temperature } = req.body;

  try {
    // ChatGPT prompt creation
    const promptGPT = `Suggest an outfit for a ${age}-year-old ${gender} for this event:
    - Event: ${eventDescription}
    - Weather: ${weather}
    - Temperature: ${temperature}°C. Include details on clothing, colors, accessories, and footwear.`;

    // Call ChatGPT API
    const chatGPTResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: promptGPT }],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    const suggestion = chatGPTResponse.data.choices[0].message.content;
    const promptDALL_E = `Design an aesthetic fashion guide image:
1. Left side: A ${gender}of ${age}-year-old wearing a stylish outfit for a  ${weather} day with a temperature of ${temperature}°C. The outfit should include light, breathable clothing suitable for the weather and event.
2. Right side: Close-up images of items like clothing, accessories, and footwear in a cohesive fashion mood board style.
Include weather symbols (e.g., sun, rain, or clouds) and text '${temperature}°C' in a clean, bold font. Use a split layout with a catalog-like design.`;



    const dallEResponse = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt: promptDALL_E,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    const imageUrl = dallEResponse.data.data[0].url;

    // Return data for result page
    res.json({ suggestion, imageUrl });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).send('Error generating style suggestions');
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
