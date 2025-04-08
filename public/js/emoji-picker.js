document.addEventListener('DOMContentLoaded', () => {
  const emojiPickerBtn = document.getElementById('emoji-picker-btn');
  const emojiPicker = document.getElementById('emoji-picker');
  const messageInput = document.getElementById('message-input');
  const categoryButtons = document.querySelectorAll('.emoji-category-btn');
  const emojiCategories = document.querySelectorAll('.emoji-category');
  
  // Gérer les emojis récents
  let recentEmojis = JSON.parse(localStorage.getItem('recentEmojis') || '[]');
  const maxRecentEmojis = 32; // Nombre maximum d'emojis récents à afficher
  
  function updateRecentEmojis() {
    const recentContainer = document.querySelector('.emoji-category[data-category="recent"] .grid');
    recentContainer.innerHTML = '';
    
    recentEmojis.forEach(emoji => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'emoji w-8 h-8 text-xl hover:bg-gray-100 rounded transition-colors flex items-center justify-center';
      button.title = emoji;
      button.textContent = emoji;
      recentContainer.appendChild(button);
    });
  }
  
  function addToRecentEmojis(emoji) {
    recentEmojis = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, maxRecentEmojis);
    localStorage.setItem('recentEmojis', JSON.stringify(recentEmojis));
    updateRecentEmojis();
  }
  
  if (emojiPickerBtn && emojiPicker) {
    // Mettre à jour les emojis récents au chargement
    updateRecentEmojis();
    
    // Toggle emoji picker
    emojiPickerBtn.addEventListener('click', () => {
      emojiPicker.classList.toggle('hidden');
    });
    
    // Gérer les catégories
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Mettre à jour les boutons actifs
        categoryButtons.forEach(btn => btn.classList.remove('active', 'bg-gray-100'));
        button.classList.add('active', 'bg-gray-100');
        
        // Afficher la catégorie correspondante
        const category = button.dataset.category;
        emojiCategories.forEach(cat => {
          if (cat.dataset.category === category) {
            cat.classList.remove('hidden');
          } else {
            cat.classList.add('hidden');
          }
        });
      });
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
        const emoji = e.target.textContent;
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(cursorPos);
        
        messageInput.value = textBefore + emoji + textAfter;
        messageInput.focus();
        messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        
        // Ajouter aux emojis récents
        addToRecentEmojis(emoji);
      }
    });
  }
}); 