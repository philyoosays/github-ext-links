
document.addEventListener('DOMContentLoaded', () => {
    fetch('popup.html')
        .then(response => response.text())
        .then(data => {
            const container = document.createElement('div');
            const scriptTag = document.createElement('script');
            
            container.innerHTML = data;
            scriptTag.src = 'js/popup.js';

            const popUpContainer = document.getElementById('popup-container');
            popUpContainer.appendChild(container);

            document.body.appendChild(scriptTag);
        })
        .catch(error => console.error('Error loading HTML:', error));
});
