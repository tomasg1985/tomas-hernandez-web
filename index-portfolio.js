const webProjectsContainer = document.getElementById('home-web-projects');

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function loadWebProjects() {
    try {
        if (!Array.isArray(window.webPortfolioProjects)) {
            throw new Error('No se encontró la lista de proyectos web_portfolio.js');
        }

        const webProjects = window.webPortfolioProjects.filter(project => project.section === 'web');

        if (webProjects.length === 0) {
            webProjectsContainer.innerHTML = '<p>No hay proyectos web para mostrar.</p>';
            return;
        }

        webProjectsContainer.innerHTML = webProjects.map(project => `
            <article class="showcase-cover-container">
                <div>
                    <p class="showcase-headline">${escapeHtml(project.project_tag)}</p>
                    <h2 class="showcase-title">${escapeHtml(project.title)}</h2>
                    <a href="${escapeHtml(project.view_project)}" target="_blank" rel="noopener noreferrer">
                        <span class="showcase-button">Ver proyecto</span>
                    </a>
                </div>
            </article>
        `).join('');
    } catch (error) {
        webProjectsContainer.innerHTML = '<p>No se pudieron cargar los proyectos web.</p>';
        console.error('Error al cargar los proyectos web:', error);
    }
}

loadWebProjects();
