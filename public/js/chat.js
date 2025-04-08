document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const messagesContainer = document.getElementById('messages-container');
  const contactList = document.querySelectorAll('.contact-item');
  const fileUpload = document.getElementById('file-upload');
  const fileUploadForm = document.getElementById('file-upload-form');
  const emojiPicker = document.getElementById('emoji-picker');
  const typingIndicator = document.getElementById('typing-indicator');

  // Current contact ID
  let currentContactId = null;

  // Get current user ID
  const currentUserId = document.querySelector('meta[name="user-id"]').getAttribute('content');

  // Socket.IO connection
  const socket = io();

  // Socket connection event
  socket.on('connect', () => {
    console.log('Connected to server');
  });

  // Socket error event
  socket.on('error', (data) => {
    showNotification(data.message, 'error');
  });

  // Handle selecting a contact
  contactList.forEach(contact => {
    contact.addEventListener('click', () => {
      window.location.href = `/chat/${contact.dataset.userId}`;
    });
  });

  // Get current contact ID from URL
  const urlParts = window.location.pathname.split('/');
  if (urlParts.length > 2) {
    currentContactId = urlParts[2];
    
    // Mark messages as read when conversation is opened
    socket.emit('mark_read', { senderId: currentContactId });
  }

  // Handle receiving messages
  socket.on('receive_message', (message) => {
    // Only display message if it's from/to the current conversation
    if ((message.sender_id == currentContactId && message.receiver_id == currentUserId) || 
        (message.sender_id == currentUserId && message.receiver_id == currentContactId)) {
      
      addMessageToUI(message);
      
      // Mark as read immediately if we're in this conversation
      if (message.sender_id == currentContactId) {
        socket.emit('mark_read', { senderId: currentContactId });
      }
    } else if (message.receiver_id == currentUserId) {
      // Update unread count for other contacts
      updateUnreadCount(message.sender_id);
    }
  });

  // Handle user status changes
  socket.on('user_status', (data) => {
    const { userId, isOnline } = data;
    const contactElement = document.querySelector(`.contact-item[data-user-id="${userId}"]`);
    
    if (contactElement) {
      const statusIndicator = contactElement.querySelector('.status-indicator');
      
      if (statusIndicator) {
        if (isOnline) {
          statusIndicator.classList.remove('bg-gray-400');
          statusIndicator.classList.add('bg-green-500');
        } else {
          statusIndicator.classList.remove('bg-green-500');
          statusIndicator.classList.add('bg-gray-400');
        }
      }
    }
  });

  // Handle marking messages as read
  socket.on('messages_read', (data) => {
    const { receiverId } = data;
    if (receiverId == currentContactId) {
      markMessagesAsRead();
    }
  });

  // Handle typing events
  let typingTimeout;
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      if (currentContactId) {
        // Clear existing timeout
        clearTimeout(typingTimeout);
        
        // Emit typing event
        socket.emit('typing', { receiverId: currentContactId });
        
        // Set timeout to stop typing after 2 seconds
        typingTimeout = setTimeout(() => {
          socket.emit('stop_typing', { receiverId: currentContactId });
        }, 2000);
      }
    });

    // Also handle when user stops typing (blur event)
    messageInput.addEventListener('blur', () => {
      if (currentContactId) {
        clearTimeout(typingTimeout);
        socket.emit('stop_typing', { receiverId: currentContactId });
      }
    });
  }

  // Handle typing indicator events
  socket.on('user_typing', (data) => {
    const { userId } = data;
    if (userId == currentContactId) {
      // Utiliser la fonction globale si elle existe, sinon utiliser le code existant
      if (window.showTypingIndicator) {
        window.showTypingIndicator();
      } else {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
          typingIndicator.classList.remove('hidden');
          typingIndicator.style.display = 'flex';
          // Scroll to typing indicator
          typingIndicator.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }
  });

  socket.on('user_stop_typing', (data) => {
    const { userId } = data;
    if (userId == currentContactId) {
      // Utiliser la fonction globale si elle existe, sinon utiliser le code existant
      if (window.hideTypingIndicator) {
        window.hideTypingIndicator();
      } else {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
          typingIndicator.classList.add('hidden');
          typingIndicator.style.display = 'none';
        }
      }
    }
  });

  // Handle file upload
  if (fileUpload && fileUploadForm) {
    fileUpload.addEventListener('change', () => {
      if (fileUpload.files.length > 0) {
        const file = fileUpload.files[0];
        
        // Check if file is an image
        if (file.type.startsWith('image/')) {
          // Show image preview
          const reader = new FileReader();
          reader.onload = function(e) {
            const previewImage = document.getElementById('file-preview-image');
            const filePreview = document.getElementById('file-preview');
            
            previewImage.src = e.target.result;
            filePreview.classList.remove('hidden');
          };
          reader.readAsDataURL(file);
        } else {
          // For non-image files, show a generic icon
          const filePreview = document.getElementById('file-preview');
          const previewImage = document.getElementById('file-preview-image');
          
          // Set a generic file icon
          previewImage.src = '/img/file-icon.svg';
          filePreview.classList.remove('hidden');
        }
      }
    });
  }

  // Remove file preview
  window.removeFilePreview = function() {
    const filePreview = document.getElementById('file-preview');
    const fileUpload = document.getElementById('file-upload');
    
    filePreview.classList.add('hidden');
    fileUpload.value = '';
  };

  // Handle form submission
  if (messageForm) {
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const content = messageInput.value.trim();
      const fileUpload = document.getElementById('file-upload');
      
      if (fileUpload.files.length > 0) {
        // If there's a file, submit the file upload form
        const fileUploadForm = document.getElementById('file-upload-form');
        fileUploadForm.submit();
      } else if (content && currentContactId) {
        // If there's text content, send as a message
        socket.emit('send_message', {
          receiverId: currentContactId,
          content: content
        });
        
        // Clear input
        messageInput.value = '';
      }
    });
  }

  // Handle blocking and unblocking users
  const blockBtn = document.getElementById('block-user');
  const unblockBtn = document.getElementById('unblock-user');

  if (blockBtn) {
    blockBtn.addEventListener('click', () => {
      socket.emit('block_user', { blockedId: currentContactId });
    });
  }

  if (unblockBtn) {
    unblockBtn.addEventListener('click', () => {
      socket.emit('unblock_user', { blockedId: currentContactId });
    });
  }

  socket.on('user_blocked', (data) => {
    window.location.reload();
  });

  socket.on('user_unblocked', (data) => {
    window.location.reload();
  });

  // Helper functions
  function addMessageToUI(message) {
    const messageElement = document.createElement('div');
    
    // Determine if message is from current user
    const isFromCurrentUser = message.sender_id == currentUserId;
    
    // Add appropriate classes based on sender
    messageElement.classList.add('chat-message');
    if (isFromCurrentUser) {
      messageElement.classList.add('chat-message-mine');
    } else {
      messageElement.classList.add('chat-message-others');
    }
    
    // Handle different message types
    if (message.message_type === 'text') {
      messageElement.textContent = message.content;
    } else if (message.message_type === 'file') {
      // Check if the file is an image
      if (message.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('message-image-container');
        
        const img = document.createElement('img');
        img.src = message.file_url;
        img.alt = 'Image';
        img.classList.add('message-image', 'rounded-lg', 'max-w-xs', 'max-h-64', 'object-cover', 'cursor-pointer');
        img.onclick = function() {
          openImagePreview(message.file_url);
        };
        
        imageContainer.appendChild(img);
        messageElement.appendChild(imageContainer);
      } else {
        // For non-image files, create a download link
        const fileLink = document.createElement('a');
        fileLink.href = message.file_url;
        fileLink.target = '_blank';
        fileLink.classList.add('flex', 'items-center', 'space-x-1');
        
        const icon = document.createElement('i');
        icon.classList.add('fas', 'fa-file-download', 'mr-1');
        
        const span = document.createElement('span');
        span.textContent = message.content;
        
        fileLink.appendChild(icon);
        fileLink.appendChild(span);
        messageElement.appendChild(fileLink);
      }
    }
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.classList.add('text-xs', 'mt-1', 'text-gray-400', 'flex', 'justify-between');
    const messageDate = new Date(message.created_at);
    timestamp.textContent = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add read indicator for messages from current user
    if (isFromCurrentUser) {
      const readIndicator = document.createElement('span');
      readIndicator.classList.add('read-indicator');
      if (message.is_read) {
        readIndicator.innerHTML = '<i class="fas fa-check-double text-blue-500"></i>';
      } else {
        readIndicator.classList.add('hidden');
      }
      timestamp.appendChild(readIndicator);
    }
    
    messageElement.appendChild(timestamp);
    
    // Add to container
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function updateUnreadCount(senderId) {
    const contactElement = document.querySelector(`.contact-item[data-user-id="${senderId}"]`);
    if (contactElement) {
      const unreadBadge = contactElement.querySelector('.unread-badge');
      
      if (unreadBadge) {
        const currentCount = parseInt(unreadBadge.textContent) || 0;
        unreadBadge.textContent = currentCount + 1;
        unreadBadge.classList.remove('hidden');
      }
    }
  }

  function markMessagesAsRead() {
    const myMessages = document.querySelectorAll('.chat-message-mine');
    myMessages.forEach(message => {
      const readIndicator = message.querySelector('.read-indicator');
      if (readIndicator) {
        readIndicator.classList.remove('hidden');
      }
    });
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.classList.add('notification', `notification-${type}`);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Scroll messages container to bottom on load
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Fonction globale pour ouvrir l'aperçu d'image en plein écran
  window.openImagePreview = function(imageUrl) {
    const modal = document.getElementById('image-preview-modal');
    const previewImage = document.getElementById('preview-full-image');
    
    // Charger l'image
    previewImage.src = imageUrl;
    modal.classList.remove('hidden');
    
    // Empêcher le défilement de la page
    document.body.style.overflow = 'hidden';
    
    // Fermer le modal avec la touche Échap
    const escHandler = function(e) {
      if (e.key === 'Escape') {
        closeImagePreview();
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Stocker le gestionnaire d'événements pour le supprimer plus tard
    modal._escHandler = escHandler;
  };

  // Fonction globale pour fermer l'aperçu d'image
  window.closeImagePreview = function() {
    const modal = document.getElementById('image-preview-modal');
    
    // Cacher le modal
    modal.classList.add('hidden');
    
    // Réactiver le défilement de la page
    document.body.style.overflow = '';
    
    // Supprimer le gestionnaire d'événements Échap
    if (modal._escHandler) {
      document.removeEventListener('keydown', modal._escHandler);
      delete modal._escHandler;
    }
  };

  // Ajouter des écouteurs d'événements pour les images existantes
  document.addEventListener('DOMContentLoaded', function() {
    // Écouteur pour les images existantes
    const messageImages = document.querySelectorAll('.message-image');
    messageImages.forEach(img => {
      img.addEventListener('click', function() {
        openImagePreview(this.src);
      });
    });
  });
}); 