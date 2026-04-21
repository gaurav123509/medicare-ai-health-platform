import { useMemo, useState } from 'react';
import { chatbotApi, getApiError } from '../services/api';

const starterPrompts = [
  'Ye website kya karti hai?',
  'Doctor appointment kaise book karun?',
  'Symptom checker kaise use hota hai?',
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Namaste! Main MediCare AI help assistant hoon. Main aapko is website ke features, doctor booking, reminders, report analysis, SOS, aur navigation ke baare me guide kar sakta hoon.',
    },
  ]);

  const history = useMemo(
    () =>
      messages
        .filter((message) => message.id !== 'welcome')
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    [messages],
  );

  const askBot = async (messageText) => {
    const trimmed = String(messageText || '').trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await chatbotApi.ask({
        message: trimmed,
        history,
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          provider: data.provider,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: getApiError(error),
          provider: 'error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await askBot(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="glass-card w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-[28px] border border-white/70 shadow-soft">
          <div className="bg-slateblue px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-extrabold">MediCare AI Assistant</p>
                <p className="mt-1 text-sm text-brand-100">
                  Website features aur usage help yahin milegi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[420px] space-y-4 overflow-y-auto bg-white px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => askBot(prompt)}
                  className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                  message.role === 'user'
                    ? 'ml-auto bg-brand-600 text-white'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.provider && message.role === 'assistant' && (
                  <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {message.provider}
                  </p>
                )}
              </div>
            ))}

            {loading && (
              <div className="max-w-[88%] rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-4">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows="2"
                placeholder="Ask about features, doctor booking, report analysis, reminders..."
                className="min-h-[52px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-3 rounded-full bg-brand-600 px-5 py-4 font-semibold text-white shadow-soft transition hover:bg-brand-700"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 font-heading text-lg font-extrabold">
          AI
        </span>
        <span>{isOpen ? 'Hide Assistant' : 'Ask Assistant'}</span>
      </button>
    </div>
  );
};

export default ChatbotWidget;
