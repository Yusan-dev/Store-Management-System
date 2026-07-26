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
            
            // Update iframe src directly with relative path to avoid file:/// unique origin security errors in Chrome
            const target = link.getAttribute('data-target');
            if (target) {
                iframe.src = target;
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
