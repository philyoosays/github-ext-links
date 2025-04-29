
document.addEventListener('DOMContentLoaded', function() {
    fetch('popup.html')
        .then(response => response.text())
        .then(data => {
            const container = document.createElement('div');
            container.innerHTML = data;

            const scriptTag = document.createElement('script');
            scriptTag.src = 'popup.js';

            const popUpContainer = document.getElementById('popup-container');
            popUpContainer.appendChild(container);

            document.body.appendChild(scriptTag);
        })
        .catch(error => console.error('Error loading HTML:', error));
});
