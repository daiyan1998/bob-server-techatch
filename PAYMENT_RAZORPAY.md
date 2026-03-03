# 💳 Razorpay Payment Integration Guide

This guide helps you integrate Razorpay payments into the **Bangel Books** server. It’s designed for developers working in **test mode**, using the Razorpay Checkout flow.

---

## 📦 Prerequisites

- Node.js v14 or above
- A [Razorpay account](https://razorpay.com/) (with access to test mode)
- Basic understanding of Express or your server framework

---

## 🛠️ Getting API Credentials

To get your **Key ID** and **Key Secret**:

1. Go to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Sign in or create an account.
3. Navigate to **Settings → API Keys**.
4. Click **Generate Test Key** (or **Live Key** for production).
5. Copy the **Key ID** and **Key Secret**.

---

## 📁 Environment Setup

Create a `.env` file in your project root and add the following:

```env
# Razorpay API Credentials
RAZORPAY_KEY_ID="your_key_id"
RAZORPAY_KEY_SECRET="your_key_secret"
