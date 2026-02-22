const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { executeCpp } = require('./executor');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// Serve the frontend
app.get('/', (res, send) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/execute', async (req, res) => {
    const { code, testCases } = req.body;

    if (!code || !testCases) {
        return res.status(400).json({ error: 'Code and test cases are required' });
    }

    try {
        const results = await executeCpp(code, testCases);
        res.json(results);
    } catch (error) {
        console.error('Execution Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Compiler backend running on http://localhost:${PORT}`);
});
