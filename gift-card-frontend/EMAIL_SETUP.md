# Setting Up Email Notifications with SendGrid

To enable email notifications for gift cards, follow these steps to set up SendGrid:

## 1. Create a SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com/) and sign up for an account
2. Verify your account and log in

## 2. Create an API Key

1. In the SendGrid dashboard, go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Name your key (e.g., "Gift Card Notifications")
4. Select **Full Access** or **Restricted Access** with at least "Mail Send" permissions
5. Click **Create & View**
6. Copy the API key (you'll only see it once)

## 3. Verify a Sender Identity

1. Go to **Settings** > **Sender Authentication**
2. Choose either **Single Sender Verification** or **Domain Authentication**
   - For testing, Single Sender Verification is faster
   - For production, Domain Authentication is recommended
3. Follow the steps to verify your email or domain

## 4. Configure Your Environment

1. Create or edit the `.env.local` file in your project root
2. Add the following variables:

```
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@example.com
```

3. Restart your development server for the changes to take effect

## 5. Testing

1. Create a gift card with a valid recipient email
2. Check if the email is received
3. Check the server logs for any errors

## Troubleshooting

If emails are not being sent:

1. Verify your API key is correct
2. Make sure your sender email is verified
3. Check server logs for any SendGrid API errors
4. Check your SendGrid dashboard's Activity feed for failed sends

## Production Deployment

When deploying to production:

1. Add the SendGrid environment variables to your hosting platform
2. Use proper domain authentication for better deliverability
3. Consider implementing email templates in SendGrid for more consistent design

For more information, see the [SendGrid Documentation](https://docs.sendgrid.com/). 