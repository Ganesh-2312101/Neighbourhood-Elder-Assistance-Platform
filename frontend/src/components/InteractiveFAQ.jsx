import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, HelpCircle } from 'lucide-react';

export default function InteractiveFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "How are community volunteers verified on NEAP?",
      a: "Every volunteer must upload a government-issued Photo ID (passport or driver's license) and a live selfie. Admin safety coordinators review and verify credentials before volunteers can claim any assistance tasks."
    },
    {
      q: "Is the assistance service completely free for seniors?",
      a: "Yes! NEAP is built as a non-profit neighborhood mutual assistance platform. Seniors never pay for volunteer time or coordination."
    },
    {
      q: "How can family members stay updated on a senior's task?",
      a: "Each task generates a secure, shareable tracking link (`/share/:taskId`). Family members can view real-time status updates without needing an account."
    },
    {
      q: "What categories of assistance can seniors request?",
      a: "Seniors can request grocery errands, prescription pickups, guided neighborhood walks, minor home repairs, technology help, and friendly conversation visits."
    }
  ];

  return (
    <div className="interactive-faq-container">
      <h2 className="section-editorial-title">Frequently Asked Questions</h2>
      <p className="section-editorial-subtitle">Click any question to learn more about NEAP's safety & operations</p>

      <div className="faq-list">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className={`faq-item ${isOpen ? 'open' : ''}`}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <div className="faq-question-row">
                <span className="faq-question-text">{faq.q}</span>
                <ChevronDown 
                  style={{ 
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s ease',
                    flexShrink: 0 
                  }} 
                />
              </div>
              {isOpen && (
                <div className="faq-answer-content">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
