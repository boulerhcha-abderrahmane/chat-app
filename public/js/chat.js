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

  // Handle typing indicator
  socket.on('user_typing', (data) => {
    const { userId } = data;
    if (userId == currentContactId) {
      typingIndicator.classList.remove('hidden');
    }
  });

  socket.on('user_stop_typing', (data) => {
    const { userId } = data;
    if (userId == currentContactId) {
      typingIndicator.classList.add('hidden');
    }
  });

  // Handle form submission
  if (messageForm) {
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const content = messageInput.value.trim();
      
      if (content && currentContactId) {
        // Emit message via Socket.IO
        socket.emit('send_message', {
          receiverId: currentContactId,
          content: content
        });
        
        // Clear input
        messageInput.value = '';
      }
    });
  }

  // Handle file upload
  if (fileUpload) {
    fileUpload.addEventListener('change', () => {
      if (fileUpload.files.length > 0) {
        fileUploadForm.submit();
      }
    });
  }

  // Handle emoji picker
  if (emojiPicker && messageInput) {
    emojiPicker.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji')) {
        messageInput.value += e.target.textContent;
        messageInput.focus();
      }
    });
  }

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
      const fileLink = document.createElement('a');
      fileLink.href = message.file_url;
      fileLink.textContent = message.content;
      fileLink.target = '_blank';
      messageElement.appendChild(fileLink);
    }
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.classList.add('text-xs', 'mt-1', 'text-gray-500');
    const messageDate = new Date(message.created_at);
    timestamp.textContent = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
}); 