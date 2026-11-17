const projectSections = {
    web: document.getElementById('web-projects'),
    software: document.getElementById('software-projects'),
    uxui: document.getElementById('uxui-projects'),
    ai: document.getElementById('ai-projects')
};

const searchInput = document.getElementById('project-search-input');
const keywordSearchInput = document.getElementById('keyword-search-input');
const showAllProjectsButton = document.getElementById('show-all-projects');

let allProjects = [];

function normalizeSearchText(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function showProjectCards(projects, section) {
    const projectsShowcase = projectSections[section];

    if (!projectsShowcase) {
        throw new Error(`No se encontró la sección para los proyectos: ${section}`);
    }

    if (projects.length === 0) {
        projectsShowcase.innerHTML = '<p>No se encontraron proyectos.</p>';
        return;
    }

    projectsShowcase.innerHTML = `
        <div class="showcase-cards-container">
            ${projects.map(project => `
            <div class="card">
                <div class="rate-condition-container">
                    <div class="condition-tag">
                        <p class="category">${project.project_tag}</p>
                        <p class="new-tag">${project.condition}</p>
                    </div>
                    <div class="rating">
                        <p class="rating-stars">
                            <span class="rating-score">${project.rating}</span>
                            <span class="stars">★★★★★</span>
                        </p>
                    </div>
                </div>

                <div class="project-main-card-content">
                    <h4 class="project-main-title">${project.title}</h4>
                    <p class="project-main-description">${project.description}</p>
                </div>

                <div class="languages-tag-container">
                    ${project.tech_tags.map(tag => `<span class="language-tag">${tag}</span>`).join('')}
                </div>

                <div class="card-footer">
                    <p class="card-published">${project.published}</p>
                    <div class="card-actions">
                        <a class="project-details-link" href="portfolio-details.html?id=${encodeURIComponent(project.id)}&type=web&section=${encodeURIComponent(project.section)}" data-project-id="${project.id}" data-portfolio-type="web" data-project-section="${project.section}">
                            <button class="preview-link" type="button">Ver detalles</button>
                        </a>
                        <a href="${project.view_project}" target="_blank" rel="noopener noreferrer">
                            <button class="github-link" type="button">Ver más<svg class="view-more-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>
                        </a>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>
    `;

    projectsShowcase.querySelectorAll('.project-details-link').forEach(link => {
        link.addEventListener('click', () => {
            localStorage.setItem('selectedProjectId', link.dataset.projectId);
            localStorage.setItem('selectedPortfolioType', link.dataset.portfolioType);
            localStorage.setItem('selectedProjectSection', link.dataset.projectSection);
        });
    });
}

// Renderizado de las tarjetas de proyectos de acuerdo a las busquedas en los inputs

function renderProjects() {
    const projectTerm = normalizeSearchText(searchInput.value);
    const keywordTerm = normalizeSearchText(keywordSearchInput.value);
    const visibleProjects = allProjects.filter(project => {
        const searchableText = normalizeSearchText([
            project.title,
            project.description,
            project.project_tag,
            project.condition,
            project.rating,
            project.published,
            project.section,
            ...(Array.isArray(project.tech_tags) ? project.tech_tags : [])
        ].join(' '));
        const keywords = normalizeSearchText(
            Array.isArray(project.keywords) ? project.keywords.join(' ') : ''
        );

        return (!projectTerm || searchableText.includes(projectTerm))
            && (!keywordTerm || keywords.includes(keywordTerm));
    });

    Object.keys(projectSections).forEach(section => {
        showProjectCards(
            visibleProjects.filter(project => project.section === section),
            section
        );
    });
}

// Eventos para los inputs de busqueda de campos keywords y busuqeda en tiempo real

searchInput.addEventListener('input', renderProjects);
keywordSearchInput.addEventListener('input', renderProjects);
showAllProjectsButton.addEventListener('click', () => {
    searchInput.value = '';
    keywordSearchInput.value = '';
    renderProjects();
});

// Obtener projectos del json local

async function obtainProducts() {
    try {
        const responseLocal = await fetch('web_portfolio.json')
        const localProjects = await responseLocal.json();

        allProjects = [...localProjects];

        renderProjects(allProjects);
    }catch (error) {
        console.log("Error al cargar los proyectos:", error)
    }
}

obtainProducts();