const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const authRoutes = require('./routes/auth');


app.use('/api/auth', authRoutes); 

// Sunucuyu Başlat 
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Backend sunucusu http://localhost:${PORT} adresinde ayaklandı!`);
});