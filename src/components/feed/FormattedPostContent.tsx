import React from 'react';
import { renderFormattedText } from '@/utils/textProcessing';

interface FormattedPostContentProps {
  content: string;
}

const FormattedPostContent: React.FC<FormattedPostContentProps> = ({ content }) => {
  const formattedContent = renderFormattedText(content);
  
  return (
    <div className="whitespace-pre-wrap break-words">
      {formattedContent}
    </div>
  );
};

export default FormattedPostContent; 