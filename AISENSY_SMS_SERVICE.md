
---

# 2️⃣ WhatsApp OTP via AiSensy (WhatsApp Service)

```markdown
# 🚀 WhatsApp OTP Integration with AiSensy Guide

This guide will help you integrate **WhatsApp OTP sending** into the **Bangal Books** backend using **AiSensy**.

---

## 📦 Prerequisites

- Node.js v14 or above
- An active account on [AiSensy](https://www.aisensy.com/)
- Approved **WhatsApp Business** number
- Live approved **Authentication Campaign** on AiSensy

---

## 🛠️ Getting API Credentials

1. Log into your [AiSensy Dashboard](https://app.aisensy.com/).
2. Go to **Manage → API Key** section.
3. Copy your **API Key**.

Also, get the **Campaign Name** of your live campaign from:
- **Campaigns → API Campaigns → Copy Campaign Name**

---

## 📁 Environment Setup

Add the following environment variables to your `.env` file:

```env
# AiSensy API Key
AISENSY_API_KEY="your_api_key_here"

# AiSensy Campaign Name
AISENSY_CAMPAIGN_NAME="your_campaign_name_here"
