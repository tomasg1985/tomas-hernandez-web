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
const expandedProjectSections = new Set();
const initialProjectLimit = 5;

function normalizeSearchText(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function updateMoreProjectsControl(section, projectCount) {
    const control = document.querySelector(
        `.view-more-link[data-project-section="${section}"]`
    );
    if (!control) {
        return;
    }

    const hiddenCount = Math.max(projectCount - initialProjectLimit, 0);
    const isExpanded = hiddenCount > 0 && expandedProjectSections.has(section);
    control.dataset.hiddenCount = String(hiddenCount);
    control.textContent = isExpanded
        ? 'ver menos proyectos'
        : `ver mas proyectos (${hiddenCount})`;
    control.setAttribute('aria-expanded', String(isExpanded));
    control.classList.toggle('is-disabled', hiddenCount === 0 && !isExpanded);
}

function updateProjectCarouselButtons(carousel) {
    const track = carousel.querySelector('.showcase-cards-container');
    const previousButton = carousel.querySelector('.project-carousel-arrow-prev');
    const nextButton = carousel.querySelector('.project-carousel-arrow-next');
    const maxScrollLeft = track.scrollWidth - track.clientWidth;

    previousButton.disabled = track.scrollLeft <= 1;
    nextButton.disabled = track.scrollLeft >= maxScrollLeft - 1;
}

function initializeProjectCarousel(projectsShowcase) {
    const carousel = projectsShowcase.querySelector('.project-section-carousel.has-arrows');
    if (!carousel) {
        return;
    }

    const track = carousel.querySelector('.showcase-cards-container');
    const previousButton = carousel.querySelector('.project-carousel-arrow-prev');
    const nextButton = carousel.querySelector('.project-carousel-arrow-next');

    previousButton.addEventListener('click', () => {
        track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
    });
    nextButton.addEventListener('click', () => {
        track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
    });
    track.addEventListener('scroll', () => {
        window.requestAnimationFrame(() => updateProjectCarouselButtons(carousel));
    }, { passive: true });
    updateProjectCarouselButtons(carousel);
}

function showProjectCards(projects, section) {
    const projectsShowcase = projectSections[section];

    if (!projectsShowcase) {
        throw new Error(`No se encontró la sección para los proyectos: ${section}`);
    }

    updateMoreProjectsControl(section, projects.length);

    if (projects.length === 0) {
        projectsShowcase.innerHTML = '<p>No se encontraron proyectos.</p>';
        return;
    }

    const isExpanded = projects.length > initialProjectLimit && expandedProjectSections.has(section);
    projectsShowcase.innerHTML = `
        <div class="project-section-carousel${projects.length > 1 ? ' has-arrows' : ''}${isExpanded ? ' is-expanded' : ''}">
            ${projects.length > 1 ? `
                <button class="project-carousel-arrow project-carousel-arrow-prev" type="button" aria-label="Proyecto anterior">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
                </button>
            ` : ''}
            <div class="showcase-cards-container">
            ${projects.map((project, index) => {
                const rating = projectRatings.getSummary(project, 'web');
                const ratingLabel = projectRatings.formatAverage(rating.average);
                const ratingCount = projectRatings.getCountLabel(rating.count);
                const localCountLabel = `${ratingCount} local${rating.count === 1 ? '' : 'es'}`;

                return `
            <div class="card${index >= initialProjectLimit ? ' project-card-overflow' : ''}">
                <div class="rate-condition-container">
                    <div class="condition-tag">
                        <p class="category">${project.project_tag}</p>
                        <p class="new-tag">${project.condition}</p>
                    </div>
                    <div class="rating">
                        <p class="rating-stars">
                            <span class="rating-score">${ratingLabel}</span>
                            <span class="stars" aria-hidden="true">${projectRatings.getStarsHtml(rating.average)}</span>
                        </p>
                        <p class="rating-count">${localCountLabel}</p>
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
            `;
            }).join('')}
            </div>
            ${projects.length > 1 ? `
                <button class="project-carousel-arrow project-carousel-arrow-next" type="button" aria-label="Proyecto siguiente">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"></path></svg>
                </button>
            ` : ''}
        </div>
    `;

    projectsShowcase.querySelectorAll('.project-details-link').forEach(link => {
        link.addEventListener('click', () => {
            localStorage.setItem('selectedProjectId', link.dataset.projectId);
            localStorage.setItem('selectedPortfolioType', link.dataset.portfolioType);
            localStorage.setItem('selectedProjectSection', link.dataset.projectSection);
        });
    });

    initializeProjectCarousel(projectsShowcase);
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
document.querySelectorAll('.view-more-link[data-project-section]').forEach(control => {
    control.addEventListener('click', event => {
        event.preventDefault();
        const section = control.dataset.projectSection;
        const hiddenCount = Number(control.dataset.hiddenCount || 0);

        if (hiddenCount === 0) {
            return;
        }

        if (expandedProjectSections.has(section)) {
            expandedProjectSections.delete(section);
        } else {
            expandedProjectSections.add(section);
        }
        renderProjects();
    });
});
window.addEventListener('resize', () => {
    document.querySelectorAll('.project-section-carousel.has-arrows').forEach(updateProjectCarouselButtons);
});
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

window.addEventListener('pageshow', event => {
    if (event.persisted && allProjects.length) {
        renderProjects();
    }
});
window.addEventListener('storage', event => {
    if (event.key && event.key.startsWith('portfolio-project-ratings-v1:')) {
        renderProjects();
    }
});