document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const iframe = document.getElementById('module-frame');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active to clicked
            link.classList.add('active');
            
            // Update iframe src
            const target = link.getAttribute('data-target');
            if (iframe.src && !iframe.src.endsWith(target)) {
                // Determine absolute path to prevent deep nesting issues
                const baseUrl = window.location.href.split('index.html')[0];
                iframe.src = baseUrl + target;
            }
        });
    });

    // Sidebar Toggle
    const logoBox = document.querySelector('.logo-box');
    const sidebar = document.querySelector('.sidebar');
    
    if(logoBox && sidebar) {
        logoBox.style.cursor = 'pointer';
        logoBox.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
});
