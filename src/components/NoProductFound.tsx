import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function NoProductFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Produto não encontrado
        </h1>
        
        <p className="text-gray-600 mb-6">
          O produto que você está procurando não está disponível no momento. Isso pode ser porque:
        </p>
        
        <ul className="text-left text-gray-600 mb-6 space-y-2">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            O ID do produto está incorreto
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            O produto foi desativado
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            O produto não está mais disponível
          </li>
        </ul>

        <a 
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Ir para a página inicial
        </a>
      </div>
    </div>
  );
}