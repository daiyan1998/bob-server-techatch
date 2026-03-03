# Bengal Books API

Backend API for Bengal Books project

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`PORT`

`NODE_ENV`

`ACCESS_TOKEN_SECRET`

`REFRESH_TOKEN_SECRET`

`DATABASE_URL`


## Payment Gateways

- [bKash Integration Guide](PAYMENT_BKASH.md)
- [Razorpay Integration Guide](PAYMENT_RAZORPAY.md)




## SMS SERVICE

- [Bulk SMS Integration Guide](BULK_SMS_SERVICE.md)
- [AiSensy SMS Integration Guide](AISENSY_SMS_SERVICE.md)


## Run Locally

Clone the project

```bash
  git clone https://github.com/techatchio/bengal-books-server.git
```

Go to the project directory

```bash
  cd <project-directory>
```

Install dependencies

```bash
  npm install
```

Migrate database

```bash
  npx prisma migrate dev
```

Seed the database

```bash
  npm run seed
```

Run the server in development mode

```bash
  npm run dev
```
