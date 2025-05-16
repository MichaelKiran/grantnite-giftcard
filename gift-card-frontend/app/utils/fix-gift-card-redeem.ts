'use client';

/**
 * Utility function to fix gift card data when redeeming
 * This ensures that the message and senderName from the JSON file are properly used
 */

export function fixGiftCardData(parsedData: any) {
  if (!parsedData) return parsedData;
  
  
  
  // Ensure we have the correct sender name
  // Prioritize senderName field, fall back to creator or createdBy
  if (!parsedData.senderName && (parsedData.creator || parsedData.createdBy)) {
    parsedData.senderName = parsedData.creator || parsedData.createdBy;
    
  }
  
  // Ensure default message is only used if no message is provided
  if (!parsedData.message) {
    parsedData.message = 'Enjoy your gift card!';
    
  } else {
    
  }
  
  // Handle all possible theme information sources
  
  // Check for selectedTemplate field (used in creation form)
  if (parsedData.selectedTemplate !== undefined && parsedData.themeId === undefined) {
    parsedData.themeId = parsedData.selectedTemplate;
    
  }
  
  // Check for selectedTheme object (used in creation form)
  if (parsedData.selectedTheme && typeof parsedData.selectedTheme === 'object') {
    if (parsedData.themeId === undefined && parsedData.selectedTheme.id !== undefined) {
      parsedData.themeId = parsedData.selectedTheme.id;
      
    }
    
    if (!parsedData.themeName && parsedData.selectedTheme.name) {
      parsedData.themeName = parsedData.selectedTheme.name;
      
    }
  }
  
  // Ensure theme information is consistent
  // If we have themeId but no themeName, set a default themeName
  if (parsedData.themeId !== undefined && !parsedData.themeName) {
    
    
    // Default theme names based on common IDs
    const defaultThemeNames: {[key: number]: string} = {
      0: 'classic',
      1: 'ocean',
      2: 'forest',
      3: 'sunset',
      10: 'birthday',
      11: 'congratulations',
      12: 'thank_you',
      13: 'holidays'
    };
    
    parsedData.themeName = defaultThemeNames[parsedData.themeId] || 'classic';
  }
  
  // If we have themeName but no themeId, set a default themeId
  if (parsedData.themeName && parsedData.themeId === undefined) {
    
    
    // Default theme IDs based on common names
    const defaultThemeIds: {[key: string]: number} = {
      'classic': 0,
      'ocean': 1,
      'forest': 2,
      'sunset': 3,
      'birthday': 10,
      'congratulations': 11,
      'thank_you': 12,
      'holidays': 13
    };
    
    parsedData.themeId = defaultThemeIds[parsedData.themeName.toLowerCase()] || 0;
  }
  
  return parsedData;
}

/**
 * Utility function to mark a gift card as starting redemption
 * This ensures the original message and sender name are preserved
 */
export function markRedemptionStart(giftCardKey: string, parsedData?: any, giftCardData?: any) {
  try {
    if (!giftCardKey) return false;
    
    const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards') || '{}';
    const redeemedCards = JSON.parse(redeemedCardsJSON);
    
    // Store original message and sender name
    const originalMessage = parsedData?.message || giftCardData?.message || 'Enjoy your gift card!';
    const senderName = parsedData?.senderName || giftCardData?.creator || 'Unknown sender';
    
    // Ensure theme information is preserved from the original data
    const themeId = parsedData?.themeId || giftCardData?.themeId || 0;
    const themeName = parsedData?.themeName || giftCardData?.themeName || 'classic';
    
    // Preserve token information
    const tokenMint = parsedData?.tokenMint || giftCardData?.tokenMint;
    const tokenSymbol = parsedData?.tokenSymbol || giftCardData?.tokenSymbol;
    const tokenName = parsedData?.tokenName || giftCardData?.tokenName;
    
    // Check if there's existing data with a different token mint
    if (redeemedCards[giftCardKey] && redeemedCards[giftCardKey].tokenMint &&
        tokenMint && redeemedCards[giftCardKey].tokenMint !== tokenMint) {
      // This is a different token type, so create a new entry with the token mint as a suffix
      const newKey = `${giftCardKey}_${tokenMint}`;
      redeemedCards[newKey] = {
        redemption_start: Date.now(),
        amount: giftCardData?.amount || 0,
        creator: senderName,
        senderName: senderName,
        message: originalMessage,
        originalMessage: originalMessage,
        themeId: themeId,
        themeName: themeName,
        tokenMint: tokenMint,
        tokenSymbol: tokenSymbol,
        tokenName: tokenName
      };
    } else {
      // Update or create the normal entry
      redeemedCards[giftCardKey] = {
        ...redeemedCards[giftCardKey],
        redemption_start: Date.now(),
        amount: giftCardData?.amount || 0,
        creator: senderName,
        senderName: senderName,
        message: originalMessage,
        originalMessage: originalMessage,
        themeId: themeId,
        themeName: themeName,
        tokenMint: tokenMint,
        tokenSymbol: tokenSymbol,
        tokenName: tokenName
      };
    }
    
    localStorage.setItem('redeemedGiftCards', JSON.stringify(redeemedCards));
    
    return true;
  } catch (error) {
    
    return false;
  }
}

/**
 * Utility function to ensure localStorage data is correctly formatted
 */
export function fixLocalStorageGiftCards() {
  try {
    // Fix redeemed cards
    const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards');
    if (redeemedCardsJSON) {
      const redeemedCards = JSON.parse(redeemedCardsJSON);
      let changed = false;
      
      Object.keys(redeemedCards).forEach(key => {
        const card = redeemedCards[key];
        
        // If the original message is available, make sure it's used
        if (card.originalMessage && card.message !== card.originalMessage) {
          card.message = card.originalMessage;
          changed = true;
        }
        
        // If senderName is missing, use creator field
        if (!card.senderName && card.creator) {
          card.senderName = card.creator;
          changed = true;
        }
        
        // Fix theme information
        // If we have themeId but no themeName, set a default themeName
        if (card.themeId !== undefined && !card.themeName) {
          // Default theme names based on common IDs
          const defaultThemeNames: {[key: number]: string} = {
            0: 'classic',
            1: 'ocean',
            2: 'forest',
            3: 'sunset',
            10: 'birthday',
            11: 'congratulations',
            12: 'thank_you',
            13: 'holidays'
          };
          
          card.themeName = defaultThemeNames[card.themeId] || 'classic';
          changed = true;
        }
        
        // If we have themeName but no themeId, set a default themeId
        if (card.themeName && card.themeId === undefined) {
          // Default theme IDs based on common names
          const defaultThemeIds: {[key: string]: number} = {
            'classic': 0,
            'ocean': 1,
            'forest': 2,
            'sunset': 3,
            'birthday': 10,
            'congratulations': 11,
            'thank_you': 12,
            'holidays': 13
          };
          
          card.themeId = defaultThemeIds[card.themeName] || 0;
          changed = true;
        }
      });
      
      if (changed) {
        localStorage.setItem('redeemedGiftCards', JSON.stringify(redeemedCards));
        
      }
    }
    
    // Fix latest gift card data
    const latestGiftCardJSON = localStorage.getItem('latestGiftCard');
    if (latestGiftCardJSON) {
      const latestCard = JSON.parse(latestGiftCardJSON);
      let cardChanged = false;
      
      // If senderName is missing, use createdBy field
      if (!latestCard.senderName && latestCard.createdBy) {
        latestCard.senderName = latestCard.createdBy;
        cardChanged = true;
      }
      
      // Fix theme information
      // If we have themeId but no themeName, set a default themeName
      if (latestCard.themeId !== undefined && !latestCard.themeName) {
        // Default theme names based on common IDs
        const defaultThemeNames: {[key: number]: string} = {
          0: 'classic',
          1: 'ocean',
          2: 'forest',
          3: 'sunset',
          10: 'birthday',
          11: 'congratulations',
          12: 'thank_you',
          13: 'holidays'
        };
        
        latestCard.themeName = defaultThemeNames[latestCard.themeId] || 'classic';
        cardChanged = true;
      }
      
      // If we have themeName but no themeId, set a default themeId
      if (latestCard.themeName && latestCard.themeId === undefined) {
        // Default theme IDs based on common names
        const defaultThemeIds: {[key: string]: number} = {
          'classic': 0,
          'ocean': 1,
          'forest': 2,
          'sunset': 3,
          'birthday': 10,
          'congratulations': 11,
          'thank_you': 12,
          'holidays': 13
        };
        
        latestCard.themeId = defaultThemeIds[latestCard.themeName] || 0;
        cardChanged = true;
      }
      
      if (cardChanged) {
        localStorage.setItem('latestGiftCard', JSON.stringify(latestCard));
        
      }
    }
    
    return true;
  } catch (error) {
    
    return false;
  }
} 