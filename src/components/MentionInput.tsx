import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';

interface User {
  username: string;
  avatar?: string;
}

interface MentionInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  containerClassName?: string;
}

const MentionInput = React.forwardRef<HTMLTextAreaElement, MentionInputProps>(({ 
  value, 
  onChange, 
  className,
  containerClassName,
  ...props 
}, ref) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Combine refs
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(innerRef.current);
    } else {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = innerRef.current;
    }
  }, [ref]);

  useEffect(() => {
    if (props.autoFocus && innerRef.current) {
      // Small timeout to allow for transitions/animations to start
      const timer = setTimeout(() => {
        innerRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [props.autoFocus]);

  useEffect(() => {
    if (!showSuggestions) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/profile/search?q=${query}`);
        setUsers(res.data);
        setSuggestionIndex(0);
      } catch (err) {
        console.error("Failed to search users", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, showSuggestions]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Check for mention trigger
    // We look backwards from cursor
    let found = false;
    for (let i = cursorPos - 1; i >= 0; i--) {
      const char = val[i];
      if (char === '@') {
        // Check if it's a valid start (beginning of line or preceded by space)
        if (i === 0 || /\s/.test(val[i - 1])) {
           const potentialQuery = val.substring(i + 1, cursorPos);
           // If query contains space, stop (unless we want to support spaces in names, but our username rules don't allow it usually)
           if (!/\s/.test(potentialQuery)) {
             setMentionStart(i);
             setQuery(potentialQuery);
             setShowSuggestions(true);
             found = true;
           }
        }
        break;
      }
      if (/\s/.test(char)) {
        // Stop if we hit a space before finding @
        break;
      }
    }
    
    if (!found) {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % users.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + users.length) % users.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectUser(users[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const selectUser = (user: User) => {
    if (mentionStart === -1) return;
    
    const before = value.substring(0, mentionStart);
    // +1 for the @, and query.length
    const after = value.substring(mentionStart + 1 + query.length);
    
    const newValue = `${before}@${user.username} ${after}`;
    
    // Create a synthetic event
    const event = {
      target: { value: newValue },
      currentTarget: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onChange(event);
    setShowSuggestions(false);
    
    // Restore focus and cursor (simple approximation)
    setTimeout(() => {
        if (innerRef.current) {
            innerRef.current.focus();
            const newCursorPos = mentionStart + 1 + user.username.length + 1;
            innerRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  return (
    <div className={`relative ${containerClassName || ''}`}>
      <textarea
        ref={innerRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
      
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-1 left-0"
          style={{
             // Position: for now just below the textarea or at fixed position?
             // Calculating precise cursor position is hard without a library.
             // We'll position it at the bottom left of the textarea for now, or maybe we can do better.
             // Actually, let's put it absolutely positioned relative to the container.
             top: "100%"
          }}
        >
          {loading ? (
            <div className="p-2 flex items-center justify-center text-slate-500">
               <Loader2 size={16} className="animate-spin mr-2" /> 搜索中...
            </div>
          ) : users.length > 0 ? (
            <ul className="max-h-48 overflow-y-auto">
              {users.map((user, index) => (
                <li
                  key={user.username}
                  onClick={() => selectUser(user)}
                  className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
                    index === suggestionIndex 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <img 
                    src={user.avatar || `https://cravatar.eu/helmavatar/${user.username}/16.png`} 
                    alt={user.username} 
                    className="w-6 h-6 rounded-full mr-2" 
                  />
                  <span className="text-sm">{user.username}</span>
                </li>
              ))}
            </ul>
          ) : (
             <div className="p-2 text-center text-slate-500 text-xs">
                没有找到用户
             </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MentionInput;
