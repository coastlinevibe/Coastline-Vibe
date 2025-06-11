// Blacklisted terms for automatic moderation
// These are organized by category for easier management
const BLACKLISTED_TERMS = {
  scam: [
    'buy followers',
    'free giveaway',
    'not a scam',
    'get rich quick',
    'make money fast',
    'earn from home',
    'guaranteed profit',
    'investment opportunity',
    'double your money',
    'financial freedom',
    'passive income',
    'limited time offer',
    'act now',
    'exclusive deal',
    'secret method',
    'hidden trick',
    'they don\'t want you to know',
    'miracle solution',
    'instant results',
    'click here',
    'risk-free',
    'no risk',
    'zero risk',
    'no obligation',
    'no credit card required',
    'no experience needed',
    'congratulations you won',
    'you\'re a winner',
    'you are selected',
    'you\'ve been chosen',
    'special promotion'
  ],
  inappropriate: [
    // Keeping this empty for now as we don't want to include actual inappropriate terms in the code
    // Would be populated with terms related to adult content, hate speech, etc.
  ],
  harassment: [
    'loser',
    'stupid',
    'idiot',
    'dumb',
    'moron',
    'worthless',
    'pathetic',
    'incompetent',
    'useless',
    'failure'
  ],
  profanity: [
    'damn',
    'hell',
    'crap',
    'ass',
    'a$$',
    'a**',
    'a-hole',
    'asshole',
    'b*tch',
    'b!tch',
    'bastard',
    'bullsh*t',
    'bs',
    'f*ck',
    'f**k',
    'f-word',
    'fck',
    'sh*t',
    'sh!t',
    's**t',
    's-word'
    // Note: This is a limited set of mild profanity terms for demonstration
    // In a real system, you would have a more comprehensive list
  ]
};

// Violation types with corresponding messages
export enum ViolationType {
  NONE = 'none',
  SCAM = 'scam',
  INAPPROPRIATE = 'inappropriate',
  HARASSMENT = 'harassment',
  PROFANITY = 'profanity'
}

interface ModeratedContent {
  isViolation: boolean;
  violationType: ViolationType;
  flaggedTerms: string[];
  message: string;
}

/**
 * Check content for violations against blacklisted terms
 * @param content The content to check
 * @returns ModeratedContent object with violation details
 */
export const checkContentViolations = (content: string): ModeratedContent => {
  if (!content) {
    return {
      isViolation: false,
      violationType: ViolationType.NONE,
      flaggedTerms: [],
      message: ''
    };
  }

  const contentLower = content.toLowerCase();
  const result: ModeratedContent = {
    isViolation: false,
    violationType: ViolationType.NONE,
    flaggedTerms: [],
    message: ''
  };

  // Check for scam terms
  const scamTerms = BLACKLISTED_TERMS.scam.filter(term => 
    contentLower.includes(term)
  );
  
  if (scamTerms.length > 0) {
    result.isViolation = true;
    result.violationType = ViolationType.SCAM;
    result.flaggedTerms = scamTerms;
    result.message = "Your post contains language commonly associated with scams. Please review and edit your content.";
    return result;
  }

  // Check for inappropriate terms
  const inappropriateTerms = BLACKLISTED_TERMS.inappropriate.filter(term => 
    contentLower.includes(term)
  );
  
  if (inappropriateTerms.length > 0) {
    result.isViolation = true;
    result.violationType = ViolationType.INAPPROPRIATE;
    result.flaggedTerms = inappropriateTerms;
    result.message = "Your post contains inappropriate content that violates our community guidelines. Please review and edit your content.";
    return result;
  }

  // Check for harassment terms
  const harassmentTerms = BLACKLISTED_TERMS.harassment.filter(term => 
    contentLower.includes(term)
  );
  
  if (harassmentTerms.length > 0) {
    result.isViolation = true;
    result.violationType = ViolationType.HARASSMENT;
    result.flaggedTerms = harassmentTerms;
    result.message = "Please be respectful to all community members. Consider revising your language to maintain a positive environment.";
    return result;
  }

  // Check for profanity terms
  const profanityTerms = BLACKLISTED_TERMS.profanity.filter(term => 
    contentLower.includes(term)
  );
  
  if (profanityTerms.length > 0) {
    result.isViolation = true;
    result.violationType = ViolationType.PROFANITY;
    result.flaggedTerms = profanityTerms;
    result.message = "We aim to keep our community family-friendly. Please consider using more appropriate language.";
    return result;
  }

  return result;
};

/**
 * Get a kindness reminder message based on violation type
 * @param violationType The type of violation
 * @returns A message appropriate for the violation type
 */
export const getKindnessMessage = (violationType: ViolationType): string => {
  switch (violationType) {
    case ViolationType.SCAM:
      return "We've detected language commonly associated with scams. To protect our community, please review and edit your content.";
    
    case ViolationType.INAPPROPRIATE:
      return "We strive to maintain a respectful environment. Your post contains content that may be inappropriate for our community.";
    
    case ViolationType.HARASSMENT:
      return "Let's keep our community positive and supportive. Please consider using more respectful language in your post.";
    
    case ViolationType.PROFANITY:
      return "We aim to keep our community family-friendly. Please consider revising your language to be appropriate for all audiences.";
    
    default:
      return "Please ensure your content follows our community guidelines.";
  }
};

/**
 * Highlight flagged terms in content
 * @param content The original content
 * @param flaggedTerms Array of terms to highlight
 * @returns Content with flagged terms highlighted
 */
export const highlightFlaggedContent = (content: string, flaggedTerms: string[]): string => {
  if (!content || !flaggedTerms.length) return content;
  
  let highlightedContent = content;
  flaggedTerms.forEach(term => {
    const regex = new RegExp(term, 'gi');
    highlightedContent = highlightedContent.replace(regex, match => `**${match}**`);
  });
  
  return highlightedContent;
};

export default {
  checkContentViolations,
  getKindnessMessage,
  highlightFlaggedContent,
  ViolationType
}; 