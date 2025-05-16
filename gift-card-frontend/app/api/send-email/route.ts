import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
} else {
  
}

export async function POST(req: NextRequest) {
  try {
    
    
    // Check if SendGrid API key is set
    if (!process.env.SENDGRID_API_KEY) {
      
      return NextResponse.json(
        { 
          error: 'SendGrid API key is not configured',
          solution: 'Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in your .env.local file'
        },
        { status: 500 }
      );
    }

    // Parse the request body
    const {
      recipientEmail,
      giftCardPublicKey,
      giftCardSecretKey,
      message,
      amount,
      templateColor = '#000000',
      templateName = 'Minimal Dark',
      templateGradient = 'linear-gradient(45deg, #0f0f0f, #2a2a2a)',
      expiryDate = null,
      senderName = 'Anonymous',
      themeId = 0,
      themeName = 'classic'
    } = await req.json();

    
    

    // Validate input
    if (!recipientEmail || !giftCardPublicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format expiry date if provided
    const expiryDateFormatted = expiryDate 
      ? new Date(expiryDate).toLocaleDateString() 
      : 'No expiration date';
    
    // Create the email content with gift card design
    const emailContent = {
      to: recipientEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject: 'You received a Solana Gift Card!',
      html: `
        <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; padding: 20px; background-color: black; color: white; border: 1px solid white;">
          <h1 style="text-align: center; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 30px; font-size: 28px; border-bottom: 1px solid white; padding-bottom: 10px; color: white;">
            YOU'VE RECEIVED A GIFT CARD
          </h1>

          <div style="background-color: ${templateColor}; 
                      background-image: ${templateGradient};
                      width: 100%; 
                      max-width: 400px;
                      margin: 0 auto;
                      padding: 24px; 
                      border-radius: 4px;
                      color: white;
                      margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-bottom: 40px;">
              <div>
                <div style="width: 32px; height: 32px; border-radius: 50%; background-color: rgba(255,255,255,0.1); margin-bottom: 10px;"></div>
                ${themeName ? `<div style="font-size: 12px; text-transform: uppercase; opacity: 0.7;">${themeName}</div>` : ''}
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; text-transform: uppercase; opacity: 0.7; margin-bottom: 4px;">AMOUNT</div>
                <div style="font-size: 24px; font-weight: bold;">${amount} SOL</div>
                ${message && message.trim() ? `<div style="font-size: 12px; opacity: 0.8; margin-top: 10px; font-style: italic;">"${message}"</div>` : ''}
              </div>
            </div>
            
            <div style="font-size: 12px; opacity: 0.6; text-transform: uppercase; margin-top: 16px;">
              ${expiryDateFormatted}
            </div>
          </div>
          
          <div style="margin: 30px 0; border-bottom: 1px solid white; padding-bottom: 20px;">
            <h2 style="text-transform: uppercase; letter-spacing: -1px; font-size: 20px; margin-bottom: 15px; color: white;">GIFT CARD DETAILS</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); width: 30%;">Amount:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); font-weight: bold; color: white;">${amount} SOL</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7);">From:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: white;">${senderName}</td>
              </tr>
              ${themeName ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7);">Theme:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: white;">${themeName}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7);">Expires:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: white;">${expiryDateFormatted}</td>
              </tr>
              ${message && message.trim() ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7);">Message:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); font-style: italic; color: white;">"${message}"</td>
              </tr>` : ''}
            </table>
          </div>
          
          <div style="margin: 30px 0; border-bottom: 1px solid white; padding-bottom: 20px;">
            <h2 style="text-transform: uppercase; letter-spacing: -1px; font-size: 20px; margin-bottom: 15px; color: white;">HOW TO REDEEM YOUR GIFT CARD</h2>
            <div style="background-color: rgba(255,255,255,0.05); padding: 15px; margin-bottom: 20px;">
              <p style="margin-bottom: 15px; color: white;">You will need the following to access your gift:</p>
              <div style="font-family: monospace; background-color: rgba(255,255,255,0.1); padding: 15px; margin-bottom: 10px; word-break: break-all;">
                <strong style="color: rgba(255,255,255,0.7);">PUBLIC KEY:</strong><br>
                <span style="color: white;">${giftCardPublicKey}</span>
              </div>
              <div style="font-family: monospace; background-color: rgba(255,255,255,0.1); padding: 15px; margin-bottom: 10px; word-break: break-all;">
                <strong style="color: rgba(255,255,255,0.7);">SECRET KEY:</strong><br>
                <span style="color: white;">${giftCardSecretKey}</span>
              </div>
              <p style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 10px; text-transform: uppercase;">
                KEEP THIS INFORMATION SECURE
              </p>
            </div>
            
            <div style="margin-top: 30px;">
              <p style="margin-bottom: 15px; text-transform: uppercase; font-weight: bold; color: white;">REDEEM YOUR GIFT CARD:</p>
              
              <div style="margin-bottom: 20px;">
                <p style="margin-bottom: 10px; color: white;">OPTION 1: CLICK DIRECT LINK (RECOMMENDED)</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/redeem/${giftCardPublicKey}?key=${encodeURIComponent(giftCardSecretKey)}" 
                   style="display: block; background-color: rgba(255,255,255,0.1); color: white; text-align: center; padding: 12px; text-decoration: none; font-weight: bold; margin-bottom: 20px;">
                  CLICK HERE TO REDEEM
                </a>
              </div>
              
              <div>
                <p style="margin-bottom: 10px; color: white;">OPTION 2: MANUAL REDEMPTION</p>
                <ol style="padding-left: 20px; line-height: 1.6; color: white;">
                  <li style="color: white;">Visit <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="color: white;">${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}</a></li>
                  <li style="color: white;">Navigate to the "REDEEM" section in the main menu</li>
                  <li style="color: white;">Copy and paste your SECRET KEY in the provided field</li>
                  <li style="color: white;">Connect your Solana wallet (like Phantom)</li>
                  <li style="color: white;">Click the "VERIFY" button, then "REDEEM" to transfer the funds to your wallet</li>
                </ol>
                
                <p style="margin-top: 15px; font-size: 12px; color: rgba(255,255,255,0.7);">
                  <strong style="color: white;">SECURITY NOTE:</strong> Your gift card is protected by the secret key. Only someone with the secret key can redeem the funds.
                </p>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid white; text-align: center;">
            <p style="text-transform: uppercase; font-size: 12px; color: rgba(255,255,255,0.5);">
              THIS IS AN AUTOMATED MESSAGE. PLEASE DO NOT REPLY.
            </p>
          </div>
        </div>
      `,
    };

    // Send the email
    
    try {
      const [response] = await sgMail.send(emailContent);
      
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        
        return NextResponse.json(
          { success: true, message: 'Email sent successfully' },
          { status: 200 }
        );
      } else {
        
        return NextResponse.json(
          { error: `SendGrid returned status code: ${response.statusCode}` },
          { status: response.statusCode }
        );
      }
    } catch (sendGridError: any) {
      
      
      // Extract meaningful error information
      const errorInfo = sendGridError.response?.body ? 
        JSON.stringify(sendGridError.response.body) : 
        sendGridError.message || 'Unknown SendGrid error';
      
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          details: errorInfo,
          solution: 'Please check your SendGrid API key and sender email configuration.'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        message: error.message || 'Unknown error',
        solution: 'Make sure your request is properly formatted and includes all required fields.'
      },
      { status: 500 }
    );
  }
} 