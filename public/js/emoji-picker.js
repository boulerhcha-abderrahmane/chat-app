document.addEventListener('DOMContentLoaded', () => {
  const emojiPickerBtn = document.getElementById('emoji-picker-btn');
  const emojiPicker = document.getElementById('emoji-picker');
  const messageInput = document.getElementById('message-input');
  
  if (emojiPickerBtn && emojiPicker) {
    // Toggle emoji picker
    emojiPickerBtn.addEventListener('click', () => {
      emojiPicker.classList.toggle('hidden');
    });
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
      if (!emojiPicker.contains(e.target) && !emojiPickerBtn.contains(e.target)) {
        emojiPicker.classList.add('hidden');
      }
    });
    
    // Insert emoji into input
    emojiPicker.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji')) {
        messageInput.value += e.target.textContent;
        messageInput.focus();
        // Don't close picker so user can add multiple emojis
      }
    });
  }
}); 