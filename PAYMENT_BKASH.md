# 🚀 bKash Tokenized Payment Integration Guide

This guide will help you integrate bKash tokenized payment into the **Bangal Books** backend. It’s designed for developers who want to test and implement bKash payments in **sandbox** or **production** mode.

---

## 📦 Prerequisites

- Node.js v14 or above
- A [bKash Developer Account](https://developer.bka.sh/)
- Tunnel software like [Tunnelmole](https://tunnelmole.com/) or [Ngrok](https://ngrok.com/) to expose your local server publicly for testing

---

## 🛠️ Getting API Credentials

To get your **App Key**, **App Secret**, **Username**, and **Password**:

1. Visit the [bKash Developer Portal](https://developer.bka.sh/).
2. Sign in or register for a developer account.
3. Apply for sandbox or production access depending on your needs.
4. After approval, you’ll receive:
   - **App Key**
   - **App Secret**
   - **Username**
   - **Password**
---

## 📁 Environment Setup

Create a `.env` file in your project root and add the following variables:

```env
# bKash API Credentials
BKASH_APP_KEY="your_app_key"
BKASH_APP_SECRET="your_app_secret"
BKASH_USERNAME="your_username"
BKASH_PASSWORD="your_password"

# bKash API Base URL
# Use sandbox URL for testing or production URL when live
BKASH_BASE_URL="https://tokenized.sandbox.bka.sh/v1.2.0-beta"

# Redirect URLs (update according to your frontend/client app)
BKASH_SUCCESS_URL="https://localhost:3000/success"
BKASH_FAIL_URL="https://localhost:3000/fail"
BKASH_CALLBACK_URL="https://your-public-url.com/api/v1/payments/validate-ban-payment"
