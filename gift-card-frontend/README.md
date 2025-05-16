This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Email Configuration Guide

## Setting Up SendGrid for Email Functionality

The gift card application uses SendGrid to send emails to gift card recipients. Follow these steps to set up SendGrid:

1. **Create a SendGrid Account**
   - Sign up for a free account at [SendGrid](https://signup.sendgrid.com/)
   - Verify your account and complete the setup process

2. **Create an API Key**
   - Go to Settings > [API Keys](https://app.sendgrid.com/settings/api_keys)
   - Click "Create API Key"
   - Name your key (e.g., "Gift Card App")
   - Choose "Full Access" or "Restricted Access" with at minimum "Mail Send" permissions
   - Copy the generated API key (you won't be able to see it again)

3. **Verify a Sender Email**
   - Go to Settings > [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
   - Either verify a single sender email or set up domain authentication
   - Follow the instructions provided by SendGrid to complete verification

4. **Configure Environment Variables**
   - Create a `.env.local` file in the root of your project (if not already present)
   - Add the following variables:
     ```
     SENDGRID_API_KEY=your_sendgrid_api_key_here
     SENDGRID_FROM_EMAIL=your_verified_sender_email@example.com
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```

5. **Test Email Functionality**
   - Start your development server (`npm run dev`)
   - Visit `http://localhost:3000/api/test-email?email=your_test_email@example.com`
   - Check for a successful response and verify the test email was received

## Troubleshooting Email Issues

If you're experiencing issues with email delivery:

1. **Check SendGrid API Key**
   - Verify your API key is correctly copied to `.env.local`
   - Make sure there are no extra spaces or characters
   
2. **Verify Sender Email**
   - Ensure your sender email is properly verified with SendGrid
   - Check that the email in `.env.local` matches a verified sender
   
3. **Monitor SendGrid Activity**
   - Check your [SendGrid Activity](https://app.sendgrid.com/email_activity) dashboard
   - Look for bounces, blocks, or other delivery issues
   
4. **Check Server Logs**
   - Monitor your NextJS server logs for detailed error messages
   - Look for specific SendGrid error codes or messages

5. **Run the Test Endpoint**
   - Use the `/api/test-email` endpoint to diagnose issues
   - Review the diagnostic information returned
   
6. **Network Issues**
   - Ensure your server has proper internet connectivity
   - Check if your hosting environment blocks outgoing SMTP connections
