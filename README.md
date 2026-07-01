# 💳 BadWallet API & Payment Service - Examen Design Pattern

Projet d'évaluation finale pour le module **Design Pattern & Architecture Logicielle** (L3 S2 - 2026). 
Cette solution implémente un écosystème complet de gestion de portefeuille électronique (`badwallet-api`) interconnecté avec un service de paiement externe (`payment-service`).

---

## 🏗️ Architecture & Écosystème

L'application est découpée en deux services distincts :
* **`badwallet-api` (Port :8080) :** Service cœur gérant les portefeuilles (Wallets), les soldes, les dépôts, retraits et transferts.
* **`payment-service` (Port :8081) :** API externe simulant les prestataires de services (ISM, WOYAFAL) pour la récupération et le paiement des factures.

---

## 🛠️ Endpoints de l'API (Spécifications de Tests)

Les routes suivantes ont été implémentées et validées (compatibles avec l'extension **REST Client** de VS Code) :

### 🔹 badwallet-api (:8080)
* `POST /api/wallets/seed` : Seeder asynchrone de la base de données.
* `POST /api/wallets` : Création d'un portefeuille (Devise: XOF).
* `GET /api/wallets` : Liste paginée des portefeuilles.
* `GET /api/wallets/{phone}` : Consultation par numéro.
* `GET /api/wallets/{phone}/balance` : Consultation rapide du solde.
* `POST /api/wallets/{id}/deposit` : Dépôt par carte ou ciblé.
* `POST /api/wallets/withdraw` : Retrait avec **calcul de frais de 1% (plafonnés à 5 000 CFA)**.
* `POST /api/wallets/transfer` : Transfert de compte à compte.
* `POST /api/wallets/pay` & `/pay-factures` : Paiement de factures via intégration du service externe.

### 🔹 Proxy & API Externe (:8080 -> :8081)
* `GET /api/external/factures/{code}/current` : Factures impayées du mois en cours (avec ou sans filtre `unite=WOYAFAL`).
* `GET /api/external/factures/{code}/periode` : Consultation sur une période donnée.

---

## 🔄 Stratégie de Versionning (GitFlow)

Conformément aux exigences du sujet, le développement a suivi scrupuleusement la stratégie de **Feature Branching** :

* **`main` :** Branche de production, stable et livrable.
* **`develop` :** Branche d'intégration principale.
* **`feature/*` :** Branches éphémères isolées, créées à partir de `develop` pour chaque endpoint, puis fusionnées après validation des tests.

*Exemple de flux de travail :*
```text
develop ────────┬───────────────────────────●───────► (Intégration)
                │                          ▲
                └─► feature/wallet-deposit ┘ (Merge)