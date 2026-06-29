import React from 'react';

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast-container" style={{ background: toast.type === 'success' ? '#166534' : '#7f1d1d' }}>
      {toast.msg}
    </div>
  );
}
