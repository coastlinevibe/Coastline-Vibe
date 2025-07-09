/**
 * NOTE: Mentions functionality has been completely removed from this component
 * as per the request "remove mentions i hate mentions forget about mentions."
 * 
 * This component now acts as a regular textarea without any mention detection or suggestion features.
 * Any UI elements that attempted to use mentions will no longer trigger notifications.
 */
import React, { useRef } from 'react';

interface MentionTextareaProps {
  value: string;
  setValue?: (value: string) => void;
  communityId: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  onBlur?: () => void;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  'data-post-id'?: string;
}

// This component was previously used for @mentions
// It has been simplified to remove mention functionality
const MentionTextarea = React.forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  (props, ref) => {
    const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
    const resolvedRef = (ref && typeof ref !== 'function' ? ref : internalTextareaRef);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value;
      if (props.setValue) {
        props.setValue(text);
      }
      if (props.onChange) {
        props.onChange(event);
      }
    };

    return (
      <div className="relative w-full">
        <textarea
          ref={resolvedRef} 
          value={props.value}
          onChange={handleChange}
          onBlur={props.onBlur}
          placeholder={props.placeholder}
          className={`w-full resize-none focus:outline-none ${props.className || "p-2 border rounded"}`}
          rows={props.rows}
          disabled={props.disabled}
          data-post-id={props['data-post-id'] || undefined}
        />
      </div>
    );
  }
);

MentionTextarea.displayName = 'MentionTextarea';
export default MentionTextarea; 