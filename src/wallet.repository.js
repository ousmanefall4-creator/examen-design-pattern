class WalletRepository {
    constructor() {
        this.wallets = new Map();
        this.events = [];
    }

    save(wallet) {
        this.wallets.set(wallet.phoneNumber, wallet);
        return wallet;
    }

    findAll() {
        return Array.from(this.wallets.values());
    }

    findByPhoneNumber(phoneNumber) {
        return this.wallets.get(phoneNumber);
    }

    saveEvent(event) {
        this.events.push(event);
        return event;
    }

    findEventsByWalletId(walletId) {
        return this.events.filter(e => e.walletId === walletId);
    }
}

module.exports = new WalletRepository();