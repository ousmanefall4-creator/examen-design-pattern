const express = require('express');
const router = express.Router();
const walletService = require('./wallet.service');

// =========================================================================
// INITIALISATION & SEEDING (Étape 1.1)
// =========================================================================
router.post('/wallets/seed', (req, res) => {
    const numWallets = parseInt(req.query.numWallets) || 10;
    const eventsPerWallet = parseInt(req.query.eventsPerWallet) || 100;
    walletService.seedWallets(numWallets, eventsPerWallet);
    res.status(202).json({ message: "Seeding démarré de manière asynchrone." });
});

// =========================================================================
// GESTION DU PORTEFEUILLE (Étapes 1.2, 1.3, 1.4 & 1.5)
// =========================================================================
router.post('/wallets', (req, res) => {
    try {
        const wallet = walletService.createWallet(req.body);
        res.status(201).json(wallet);
    } catch (err) {
        res.status(err.status || 400).json({ error: err.message });
    }
});

router.get('/wallets', (req, res) => {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    res.status(200).json(walletService.getWalletsPaginated(page, size));
});

router.get('/wallets/:phoneNumber', (req, res) => {
    try {
        res.status(200).json(walletService.getWalletByPhone(req.params.phoneNumber));
    } catch (err) {
        res.status(err.status || 404).json({ error: err.message });
    }
});

router.get('/wallets/:phoneNumber/balance', (req, res) => {
    try {
        res.status(200).json(walletService.getBalance(req.params.phoneNumber));
    } catch (err) {
        res.status(err.status || 404).json({ error: err.message });
    }
});

// =========================================================================
// TRANSACTIONS COURANTES (Étapes 1.6, 1.7, 1.8 & 1.11)
// =========================================================================

// CORRECTION : Dynamisation du numéro de téléphone depuis les paramètres REST de l'URL
router.post('/wallets/:phoneNumber/deposit', (req, res) => {
    try {
        const result = walletService.deposit(req.params.phoneNumber, req.body.amount);
        res.status(200).json(result);
    } catch (err) {
        res.status(err.status || 400).json({ error: err.message });
    }
});

router.post('/wallets/withdraw', (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        const result = walletService.withdraw(phoneNumber, amount);
        res.status(200).json(result);
    } catch (err) {
        res.status(err.status || 400).json({ error: err.message });
    }
});

router.post('/wallets/transfer', (req, res) => {
    try {
        const { senderPhone, receiverPhone, amount } = req.body;
        const result = walletService.transfer(senderPhone, receiverPhone, amount);
        res.status(200).json(result);
    } catch (err) {
        res.status(err.status || 400).json({ error: err.message });
    }
});

router.get('/wallets/:phoneNumber/transactions', (req, res) => {
    try {
        res.status(200).json(walletService.getTransactionsHistory(req.params.phoneNumber));
    } catch (err) {
        res.status(err.status || 404).json({ error: err.message });
    }
});

// =========================================================================
// PAIEMENTS DE SERVICES & FACTURES GROUPÉES (Étape 2.2 / 2.3)
// =========================================================================
router.post('/wallets/pay', (req, res) => {
    try {
        const { phoneNumber, amount } = req.body;
        const result = walletService.withdraw(phoneNumber, amount);
        res.status(200).json({ status: "SUCCESS", ...result });
    } catch (err) {
        res.status(err.status || 400).json({ error: err.message });
    }
});

// APPLIQUÉ : Liaison correcte avec le service métier payFactures
router.post('/wallets/pay-factures', (req, res) => {
    try {
        const { phoneNumber, serviceName, factureReferences } = req.body;
        const result = walletService.payFactures(phoneNumber, serviceName, factureReferences);
        res.status(200).json(result);
    } catch (err) {
        res.status(err.status || 400).json({ error: err.message });
    }
});

// =========================================================================
// PROXY API EXTERNES (Étape 2.4)
// =========================================================================
router.get('/external/factures/:walletCode/current', (req, res) => {
    try {
        const { walletCode } = req.params;
        const { unite } = req.query;
        const result = walletService.getCurrentInvoices(walletCode, unite);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/external/factures/:walletCode/periode', (req, res) => {
    try {
        const { walletCode } = req.params;
        const { debut, fin } = req.query;
        const result = walletService.getInvoicesByPeriod(walletCode, debut, fin);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;