const express = require('express');
const walletController = require('./src/wallet.controller');

const app = express();
app.use(express.json());

app.use('/api', walletController);

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  SERVEUR EXAMEN DEMARRÉ SUR http://localhost:${PORT}`);
    console.log(`====================================================`);
});