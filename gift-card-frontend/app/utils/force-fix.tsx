'use client';

/**
 * This utility forces a fix on all gift card data in localStorage
 * It ensures that:
 * 1. The senderName field is properly set
 * 2. The message field is preserved
 */

// Define card type for type safety
interface GiftCard {
  publicKey?: string;
  senderName?: string;
  createdBy?: string;
  amount?: number;
  message?: string;
  expiryTime?: number;
  creator?: string;
  [key: string]: any; // Allow for other properties
}

export function forceFixGiftCardData() {
  try {
    // Fix latest gift card
    const latestGiftCardJson = localStorage.getItem('latestGiftCard');
    if (latestGiftCardJson) {
      const latestGiftCard = JSON.parse(latestGiftCardJson) as GiftCard;
      
      // Ensure the senderName field is set
      if (!latestGiftCard.senderName && latestGiftCard.createdBy) {
        latestGiftCard.senderName = latestGiftCard.createdBy;
        localStorage.setItem('latestGiftCard', JSON.stringify(latestGiftCard));
        
      }
    }
    
    // Fix redeemed cards
    const redeemedCardsJson = localStorage.getItem('redeemedGiftCards');
    if (redeemedCardsJson) {
      const redeemedCards = JSON.parse(redeemedCardsJson) as Record<string, GiftCard>;
      let changed = false;
      
      Object.keys(redeemedCards).forEach(key => {
        const card = redeemedCards[key];
        
        // If senderName is missing, use the creator field
        if (!card.senderName && card.creator) {
          card.senderName = card.creator;
          changed = true;
        }
        
        // Ensure the creator field is not a wallet address if senderName is available
        if (card.senderName && card.creator && card.creator.startsWith('A') && card.creator.length > 30) {
          card.creator = card.senderName;
          changed = true;
        }
      });
      
      if (changed) {
        localStorage.setItem('redeemedGiftCards', JSON.stringify(redeemedCards));
        
      }
    }
    
    // Fix gift card history
    const historyJson = localStorage.getItem('giftCardHistory');
    if (historyJson) {
      const history = JSON.parse(historyJson) as GiftCard[];
      let changed = false;
      
      history.forEach((card: GiftCard) => {
        if (!card.senderName && card.createdBy) {
          card.senderName = card.createdBy;
          changed = true;
        }
      });
      
      if (changed) {
        localStorage.setItem('giftCardHistory', JSON.stringify(history));
        
      }
    }
    
    return true;
  } catch (error) {
    
    return false;
  }
} 