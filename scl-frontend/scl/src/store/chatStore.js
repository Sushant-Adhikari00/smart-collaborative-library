import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  messages: [],
  isTyping: false,

  sendMessage: async (text, documentId) => {
    const newMessage = { id: Date.now(), role: 'user', content: text };
    set((state) => ({ 
      messages: [...state.messages, newMessage],
      isTyping: true
    }));

    // Simulate AI response streaming
    setTimeout(() => {
      const aiMessageId = Date.now() + 1;
      set((state) => ({
        isTyping: false,
        messages: [...state.messages, { id: aiMessageId, role: 'ai', content: '' }]
      }));

      const fullResponse = "Based on the document, this section explains the core concepts clearly. I'd recommend reviewing page 4 for the specific formula.";
      let currentText = "";
      let charIndex = 0;

      const streamInterval = setInterval(() => {
        if (charIndex < fullResponse.length) {
          currentText += fullResponse[charIndex];
          set((state) => ({
            messages: state.messages.map(msg => 
              msg.id === aiMessageId ? { ...msg, content: currentText } : msg
            )
          }));
          charIndex++;
        } else {
          clearInterval(streamInterval);
        }
      }, 30); // 30ms per character
    }, 1000);
  },
  
  clearChat: () => set({ messages: [] })
}));
