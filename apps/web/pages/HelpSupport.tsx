import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Clock,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';

export const HelpSupport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [form, setForm] = useState({ subject: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Go to Settings → Security tab and use 'Change Password'. If you can't log in, click 'Forgot Password' on the login screen to receive a reset link via email."
    },
    {
      question: "How do I request time off?",
      answer: "Navigate to Time Off from the sidebar, then click 'Request Leave'. Select your leave type, date range, and add a reason, then submit for approval."
    },
    {
      question: "Can I edit my personal information?",
      answer: "Yes — go to Settings → General to update your name, email, phone, and bio. For other profile fields, open your employee profile and click 'Edit Profile'."
    },
    {
      question: "Where can I find my documents?",
      answer: "All your documents are in the Documents section accessible from the sidebar. You can upload, view, and download files there."
    },
    {
      question: "How do I check my attendance records?",
      answer: "Go to the Attendance page from the sidebar to view your clock-in/out history, working hours, and attendance status for each day."
    },
    {
      question: "How do I turn off email notifications?",
      answer: "Go to Settings → Notifications and toggle off Email Notifications. Changes are saved instantly."
    },
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;

    setIsSending(true);
    setSendError('');
    try {
      await api.post('/notifications/support-contact', {
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm({ subject: '', message: '' });
    } catch (err: any) {
      setSendError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Hero / Search Section */}
      <div className="bg-primary-dark rounded-2xl p-8 md:p-12 text-center text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <h1 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">How can we help you?</h1>
        <p className="text-blue-100 mb-8 max-w-2xl mx-auto relative z-10">
          Search for answers, or send a message directly to the HR team.
        </p>
        <div className="relative max-w-xl mx-auto z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search for articles, guides, or questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/30 transition-shadow"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-text-light dark:text-text-dark flex items-center gap-2">
            <HelpCircle className="text-primary" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                  >
                    <span className="font-semibold text-text-light dark:text-text-dark">{faq.question}</span>
                    {openFaqIndex === index ? (
                      <ChevronUp className="text-primary flex-shrink-0 transition-transform" size={20} />
                    ) : (
                      <ChevronDown className="text-text-muted-light flex-shrink-0 transition-transform" size={20} />
                    )}
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-5 pb-5 text-text-muted-light dark:text-text-muted-dark text-sm leading-relaxed animate-in slide-in-from-top-2 duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
                <p className="text-text-muted-light">No results found for "{searchTerm}".</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
            <h3 className="font-bold text-text-light dark:text-text-dark mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link
                to="/time-off"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors group"
              >
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text-light dark:text-text-dark">Request Time Off</p>
                  <p className="text-xs text-text-muted-light">Submit a leave request</p>
                </div>
              </Link>
              <Link
                to="/documents"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors group"
              >
                <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text-light dark:text-text-dark">My Documents</p>
                  <p className="text-xs text-text-muted-light">View and upload files</p>
                </div>
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors group"
              >
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Settings size={16} />
                </div>
                <div>
                  <p className="font-medium text-sm text-text-light dark:text-text-dark">Account Settings</p>
                  <p className="text-xs text-text-muted-light">Profile, password, notifications</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
            <h3 className="font-bold text-text-light dark:text-text-dark mb-1">Still need help?</h3>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-4">
              Send a message to the HR team and we'll get back to you.
            </p>

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="text-green-500" size={32} />
                <p className="font-medium text-text-light dark:text-text-dark">Message sent!</p>
                <p className="text-sm text-text-muted-light">The HR team has been notified and will follow up via email.</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-3">
                <input
                  type="text"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                />
                <textarea
                  rows={3}
                  placeholder="Describe your issue..."
                  value={form.message}
                  onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark resize-none"
                />
                {sendError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle size={14} /> {sendError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSending || !form.subject.trim() || !form.message.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail size={16} />
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
