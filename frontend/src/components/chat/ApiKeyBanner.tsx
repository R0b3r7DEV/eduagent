"use client";

import { useState } from "react";
import ApiKeyModal from "./ApiKeyModal";

interface Props {
  onKeyAdded: () => void;
}

export default function ApiKeyBanner({ onKeyAdded }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleSaved() {
    setModalOpen(false);
    onKeyAdded();
  }

  return (
    <>
      <div
        role="alert"
        className="flex items-center justify-between gap-4 rounded-xl border border-yellow-300
                   bg-yellow-50 px-4 py-3 text-sm text-yellow-900"
      >
        <div className="flex items-center gap-2">
          {/* Warning icon */}
          <svg
            className="h-5 w-5 shrink-0 text-yellow-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17
                 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10
                 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1
                 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <strong>Sin API key</strong> no puedo responderte.
          </span>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-semibold
                     text-yellow-900 hover:bg-yellow-500 focus:outline-none focus:ring-2
                     focus:ring-yellow-400 focus:ring-offset-1"
        >
          Añadir API key
        </button>
      </div>

      {modalOpen && (
        <ApiKeyModal onSaved={handleSaved} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
