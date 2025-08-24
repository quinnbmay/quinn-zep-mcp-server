// Temporary deployment file
console.log("Zep MCP Server - Deployment in progress");
console.log("Please upload source files to complete deployment");

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ 
    status: 'pending',
    message: 'Source files need to be uploaded'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});