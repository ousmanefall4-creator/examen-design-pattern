const { v4: uuidv4 } = require('uuid');
const walletRepository = require('./wallet.repository');
const { Wallet } = require('./wallet.model');

// =========================================================================
// PATTERN STRATEGY : Gestion des frais de retrait (Étape 1.7)
// =========================================================================

// Interface de base pour la stratégie de calcul des frais
class FeeStrategy {
    calculateFee(amount) {
        throw new Error("La méthode calculateFee doit être implémentée !");
    }
}

// Implémentation concrète : 1% du montant, plafonné à 5000 CFA
class StandardWithdrawFeeStrategy extends FeeStrategy {
    calculateFee(amount) {
        let fees = amount * 0.01;
        if (fees > 5000) {
            fees = 5000;
        }
        return fees;
    }
}

// =========================================================================
// SERVICE : WalletService
// =========================================================================

class WalletService {
    
    constructor() {
        // Injection de la stratégie par défaut lors de l'instanciation du service
        this.feeStrategy = new StandardWithdrawFeeStrategy();
    }

    /**
     * Permet de modifier dynamiquement la stratégie de frais à la volée
     * @param {FeeStrategy} strategy 
     */
    setFeeStrategy(strategy) {
        this.feeStrategy = strategy;
    }
    
    createWallet(data) {
        if (walletRepository.findByPhoneNumber(data.phoneNumber)) {
            const error = new Error("Ce portefeuille existe déjà.");
            error.status = 409;
            throw error;
        }
        const newWallet = new Wallet({ id: uuidv4(), ...data });
        return walletRepository.save(newWallet);
    }

    seedWallets(numWallets, eventsPerWallet) {
        setImmediate(() => {
            console.log(`[SEED] Lancement du seeding...`);
            for (let i = 0; i < numWallets; i++) {
                const uniqueId = uuidv4();
                const wallet = new Wallet({
                    id: uniqueId,
                    phoneNumber: `+22177${Math.floor(1000000 + Math.random() * 9000000)}`,
                    email: `user${i}@gmail.com`,
                    initialBalance: 25000,
                    code: `WLT-SEED${i}`,
                    currency: "XOF"
                });
                walletRepository.save(wallet);

                for (let j = 0; j < eventsPerWallet; j++) {
                    walletRepository.saveEvent({
                        id: uuidv4(),
                        walletId: wallet.id,
                        type: j % 2 === 0 ? 'CREDIT' : 'DEBIT',
                        amount: Math.floor(Math.random() * 100) + 1,
                        timestamp: new Date()
                    });
                }
            }
            console.log(`[SEED] Terminé.`);
        });
    }

    getWalletsPaginated(page, size) {
        const all = walletRepository.findAll();
        const start = page * size;
        return {
            content: all.slice(start, start + size),
            page, size, totalElements: all.length
        };
    }

    getWalletByPhone(phoneNumber) {
        const wallet = walletRepository.findByPhoneNumber(phoneNumber);
        if (!wallet) {
            const error = new Error("Portefeuille introuvable.");
            error.status = 404;
            throw error;
        }
        return wallet;
    }

    getBalance(phoneNumber) {
        const wallet = this.getWalletByPhone(phoneNumber);
        const events = walletRepository.findEventsByWalletId(wallet.id);

        let dynamicBalance = wallet.initialBalance;
        events.forEach(event => {
            if (event.type === 'CREDIT') dynamicBalance += event.amount;
            if (event.type === 'DEBIT') dynamicBalance -= event.amount;
        });

        return { 
            phoneNumber: wallet.phoneNumber, 
            balance: dynamicBalance, 
            currency: wallet.currency 
        };
    }

    deposit(phoneNumber, amount) {
        const wallet = this.getWalletByPhone(phoneNumber);
        walletRepository.saveEvent({
            id: uuidv4(),
            walletId: wallet.id,
            type: 'CREDIT',
            amount: Math.floor(amount),
            timestamp: new Date()
        });
        return this.getBalance(phoneNumber);
    }

    // Méthode de retrait refactorisée avec le Pattern Strategy
    withdraw(phoneNumber, amount) {
        const currentBalance = this.getBalance(phoneNumber).balance;
        
        // Délégation du calcul des frais à l'objet stratégie configuré
        const fees = this.feeStrategy.calculateFee(amount);
        
        const totalDeduction = amount + fees;

        if (currentBalance < totalDeduction) {
            const error = new Error("Solde insuffisant pour couvrir le retrait et les frais.");
            error.status = 402;
            throw error;
        }

        const wallet = this.getWalletByPhone(phoneNumber);
        walletRepository.saveEvent({
            id: uuidv4(),
            walletId: wallet.id,
            type: 'DEBIT',
            amount: Math.floor(totalDeduction),
            timestamp: new Date()
        });
        return { ...this.getBalance(phoneNumber), feesApplied: fees };
    }

    transfer(senderPhone, receiverPhone, amount) {
        const senderBalance = this.getBalance(senderPhone).balance;
        if (senderBalance < amount) {
            const error = new Error("Solde insuffisant pour le transfert.");
            error.status = 402;
            throw error;
        }

        const sender = this.getWalletByPhone(senderPhone);
        const receiver = this.getWalletByPhone(receiverPhone);

        walletRepository.saveEvent({
            id: uuidv4(),
            walletId: sender.id,
            type: 'DEBIT',
            amount: Math.floor(amount),
            timestamp: new Date()
        });

        walletRepository.saveEvent({
            id: uuidv4(),
            walletId: receiver.id,
            type: 'CREDIT',
            amount: Math.floor(amount),
            timestamp: new Date()
        });

        return { message: "Transfert effectué avec succès.", amount };
    }

    getTransactionsHistory(phoneNumber) {
        const wallet = this.getWalletByPhone(phoneNumber);
        return walletRepository.findEventsByWalletId(wallet.id);
    }

    getCurrentInvoices(walletCode, unite = null) {
        const mockInvoices = [
            { reference: "FAC-ISM-3-1", serviceName: "ISM", amount: 5000, dueDate: "2026-06-30", status: "UNPAID" },
            { reference: "FAC-WOY-3-2", serviceName: "WOYAFAL", amount: 10000, dueDate: "2026-06-25", status: "UNPAID" }
        ];
        if (unite) {
            return mockInvoices.filter(fac => fac.serviceName.toUpperCase() === unite.toUpperCase());
        }
        return mockInvoices;
    }

    getInvoicesByPeriod(walletCode, debut, fin) {
        return [
            { reference: "FAC-ISM-3-1", serviceName: "ISM", amount: 5000, dueDate: debut, status: "UNPAID" },
            { reference: "FAC-WOY-3-2", serviceName: "WOYAFAL", amount: 10000, dueDate: fin, status: "UNPAID" }
        ];
    }
}

module.exports = new WalletService();