import React from 'react';

export function AiLoading({ message = 'Génération en cours…' }) {
  return (
    <div className="ta-team__loading" role="status" aria-live="polite">
      <span className="ta-team__spinner" />
      <p>{message}</p>
    </div>
  );
}

export default AiLoading;
