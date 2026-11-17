const certificationsSections = {
    programming: document.getElementById('programming-certifications'),
    ai: document.getElementById('ai-certifications'),
    aws: document.getElementById('aws-certifications'),
    uxui: document.getElementById('uxui-certifications'),
    languages: document.getElementById('languages-certifications')
};

const searchInput = document.getElementById('design-project-search');
const keywordSearchInput = document.getElementById('design-keyword-search');
const showAllProjectsButton = document.getElementById('show-all-certifications');

let allProjects = [];


function normalizeSearchText(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function showProjectCards(projects, section) {
    const certificationsShowcase = certificationsSections[section];

    if (!certificationsShowcase) {
        throw new Error(`No se encontró la sección para los proyectos: ${section}`);
    }

    if (projects.length === 0) {
        certificationsShowcase.innerHTML = '<p>No se encontraron proyectos.</p>';
        return;
    }

    certificationsShowcase.innerHTML = `
        <div class="showcase-cards-container">
            ${projects.map(project => {
                const projectDetailsUrl = `portfolio-details.html?id=${encodeURIComponent(project.id)}&type=design&section=${encodeURIComponent(project.section)}`;
                const isVideoProject = typeof project.view_project === 'string'
                    && /\.mp4(?:$|[?#])/i.test(project.view_project);
                const moreProjectAction = isVideoProject
                    ? `<button class="github-link project-video-play" type="button" data-video-url="${encodeURIComponent(project.view_project)}">Reproducir<svg class="view-more-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>`
                    : `<a href="${project.view_project}" target="_blank" rel="noopener noreferrer">
                        <button class="github-link" type="button">Ver más<svg class="view-more-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6"/></svg></button>
                    </a>`;

                return `
            <div class="card">
                <div class="rate-condition-container">
                    <div class="condition-tag">
                        <p class="category">${project.project_tag}</p>
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
                        <a class="project-details-link" href="${projectDetailsUrl}" data-project-id="${project.id}" data-portfolio-type="design" data-project-section="${project.section}">
                            <button class="preview-link" type="button">Ver detalles</button>
                        </a>
                        ${moreProjectAction}
                    </div>
                </div>
            </div>
            `;
            }).join('')}
        </div>
    `;

    certificationsShowcase.querySelectorAll('.project-details-link').forEach(link => {
        link.addEventListener('click', () => {
            localStorage.setItem('selectedProjectId', link.dataset.projectId);
            localStorage.setItem('selectedPortfolioType', link.dataset.portfolioType);
            localStorage.setItem('selectedProjectSection', link.dataset.projectSection);
        });
    });

    certificationsShowcase.querySelectorAll('.project-video-play').forEach(button => {
        button.addEventListener('click', () => {
            openProjectVideo(button.dataset.videoUrl);
        });
    });
}

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

    Object.keys(certificationsSections).forEach(section => {
        showProjectCards(
            visibleProjects.filter(project => project.section === section),
            section
        );
    });
}

searchInput.addEventListener('input', renderProjects);
keywordSearchInput.addEventListener('input', renderProjects);
showAllProjectsButton.addEventListener('click', () => {
    searchInput.value = '';
    keywordSearchInput.value = '';
    renderProjects();
});

async function obtainProducts() {
    try {
        const responseLocal = await fetch('certifications.json')
        const localProjects = await responseLocal.json();

        allProjects = [...localProjects];

        renderProjects(allProjects);
    }catch (error) {
        console.log("Error al cargar los proyectos:", error)
    }
}

obtainProducts();