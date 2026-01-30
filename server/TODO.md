# Payment

- User gets a list of all the NGOs with Priority list based on location and urgency.
- User selects an NGO to donate to.
- User selects the amount to donate.
- Now the payment is made through Razorpay gateway.
## Flow for Payment

### Normal Successful Flow

1. POST /api/payments/create-order
2. Razorpay Checkout (frontend)
3. POST /api/payments/verify
4. Razorpay Webhook → payment.captured

### If Client Verification Fails
1. POST /api/payments/create-order
2. Razorpay Checkout
3. Razorpay Webhook → payment.captured

### Failed Payment Flow
1. POST /api/payments/create-order
2. Razorpay Checkout fails
3. Razorpay Webhook → payment.failed

# Todo

- Make auth.middleware.js to verify NGO
- Validate cookieOptions

# APIs Made

- Authentication for User and NGO
- Payment related api endpoints
- CRON schedule to fetch issues and update it in DB, calls the model_server, to fetch the array of issues and creates it in the database
- Todo: Report submission by NGO, raise-issues, currentIssues, emailSend to users and NGOs