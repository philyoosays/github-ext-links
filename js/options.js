
const IS_OPTIONS = true;

document.addEventListener('DOMContentLoaded', () => {
    fetch('popup.html')
        .then(response => response.text())
        .then(data => {
            const popUpContainer = document.getElementById('popup-container');
            popUpContainer.innerHTML = data;

            const scripts = data.match(/\n *<script src="([\S\/]+)">/g)
            for (const scriptTag of scripts) {
                const scriptSrc = scriptTag.match(/src="([\S\/]+)">/)[1];
                if (scriptSrc.endsWith('/env.js')) {
                    continue;
                }

                const script = document.createElement('script');
                script.src = scriptSrc;
                document.body.appendChild(script);
            }
        })
        .catch(error => console.error('Error loading HTML:', error));
});
