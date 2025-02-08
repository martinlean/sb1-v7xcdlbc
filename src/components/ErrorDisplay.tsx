import React from 'react';
import { AlertCircle, Database } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  details?: string[];
  type?: 'connection' | 'general';
}

export default function ErrorDisplay({ message, details, type = 'general' }: ErrorDisplayProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center text-red-500 mb-4">
          {type === 'connection' ? (
            <Database className="w-12 h-12" />
          ) : (
            <AlertCircle className="w-12 h-12" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
          {type === 'connection' ? 'Connection Error' : 'Error'}
        </h1>
        <p className="text-center text-gray-600 mb-4">
          {message}
        </p>
        {details && details.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-red-800 mb-2">Please check:</h2>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}