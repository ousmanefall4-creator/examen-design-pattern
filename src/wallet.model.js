class Wallet {
    constructor({ id, phoneNumber, email, initialBalance, code, currency }) {
        if (initialBalance < 0) {
            throw new Error("Le solde initial ne peut pas être négatif.");
        }
        this.id = id;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.initialBalance = Math.floor(initialBalance);
        this.code = code;
        this.currency = currency || 'XOF';
        this.createdAt = new Date();
    }
}

module.exports = { Wallet };