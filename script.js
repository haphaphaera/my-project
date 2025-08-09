const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');
const videoButton = document.getElementById('video-button');

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = `Anda: ${message}`;
        messagesDiv.appendChild(messageElement);
        messageInput.value = '';

        // Simulasi respons AI
        simulateAIResponse(message);
    }
});

function simulateAIResponse(userMessage) {
    const responseElement = document.createElement('div');
    responseElement.textContent = `AI: Terima kasih atas pesan Anda: "${userMessage}"`;
    messagesDiv.appendChild(responseElement);
}

videoButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({video: true})
        .then((stream) => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            document.body.appendChild(video);
        })
        .catch((error) => {
            console.error('Error accessing the webcam', error);
        });
});
