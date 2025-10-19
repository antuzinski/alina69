import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const MarkdownHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const examples = [
    {
      title: 'Заголовки',
      syntax: '# Большой заголовок\n## Средний заголовок\n### Маленький заголовок',
      description: 'Используйте # для заголовков разного уровня'
    },
    {
      title: 'Выделение текста',
      syntax: '**Жирный текст**\n*Курсивный текст*',
      description: 'Двойные звездочки для жирного, одинарные для курсива'
    },
    {
      title: 'Цитаты',
      syntax: '> Это короткая цитата\n\n> Это длинная цитата, которая может\n> занимать несколько строк и будет\n> отображаться как единый блок.\n>\n> Новый абзац внутри той же цитаты.',
      description: 'Используйте > в начале каждой строки. Пустая строка с > создает новый абзац внутри цитаты'
    },
    {
      title: 'Списки',
      syntax: '- Элемент списка\n- Другой элемент\n\n1. Нумерованный список\n2. Второй пункт',
      description: 'Дефис для маркированного, цифры для нумерованного'
    },
    {
      title: 'Ссылки',
      syntax: '[Текст ссылки](https://example.com)',
      description: 'Текст в квадратных скобках, URL в круглых'
    },
    {
      title: 'Код',
      syntax: '`код в строке`\n\n```\nблок кода\nнесколько строк\n```',
      description: 'Одинарные обратные кавычки для строки, тройные для блока'
    }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1 text-gray-400 hover:text-emerald-500 transition-colors text-sm"
        title="Справка по Markdown"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Markdown справка</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">Справка по Markdown</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {examples.map((example, index) => (
            <div key={index} className="space-y-2">
              <h4 className="text-emerald-400 font-medium">{example.title}</h4>
              <p className="text-gray-400 text-sm">{example.description}</p>
              <pre className="bg-gray-900 rounded p-3 text-sm text-gray-300 overflow-x-auto">
                <code>{example.syntax}</code>
              </pre>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              💡 <strong>Совет:</strong> Вы можете комбинировать разные элементы и использовать обычные ссылки - они автоматически станут кликабельными.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownHelp;