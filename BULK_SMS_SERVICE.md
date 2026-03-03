# 🚀 Bulk SMS OTP Integration Guide

This guide will help you integrate **BulkSMSBD** SMS service into the **Bangal Books** backend project. It’s designed for sending OTPs and notifications via SMS.

---

## 📦 Prerequisites

- Node.js v14 or above
- An active account on [BulkSMSBD](https://bulksmsbd.net/)
- SMS API credentials (API Key, Sender ID)

---

## 🛠️ Getting API Credentials

1. Log into your [BulkSMSBD Dashboard](https://bulksmsbd.net/).
2. Navigate to **API Settings**.
3. Copy your:
   - **API Key**
   - **Sender ID**

---

## 📁 Environment Setup

Add the following environment variables to your `.env` file:

```env
# Bulk SMS API Credentials
BULK_SMS_API_KEY="your_api_key_here"
BULK_SMS_SENDER_ID="your_sender_id_here"
