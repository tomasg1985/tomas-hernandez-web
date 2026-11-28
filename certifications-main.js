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
const expandedCertificationSections = new Set();

function getInitialCertificationLimit() {
    if (window.matchMedia('(max-width: 992px)').matches) return 2;
    if (window.matchMedia('(max-width: 1200px)').matches) return 3;
    if (window.matchMedia('(max-width: 1500px)').matches) return 4;
    return 5;
}

let renderedInitialCertificationLimit = getInitialCertificationLimit();

function getCurrentLang() {
    return window.i18n?.getLang() || 'es';
}

function t(key, fallback = '') {
    const val = window.i18n?.t(key);
    return val && val !== key ? val : fallback;
}

function getLocalizedValue(item, field, fallback = '') {
    const lang = getCurrentLang();
    return (
        item?.i18n?.[lang]?.[field] ??
        item?.[field] ??
        item?.i18n?.es?.[field] ??
        fallback
    );
}

function normalizeSearchText(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function updateMoreCertificationsControl(section, projectCount) {
    const control = document.querySelector(
        `.view-more-link[data-project-section="${section}"]`
    );
    if (!control) {
        return;
    }

    const initialCertificationLimit = getInitialCertificationLimit();
    const hiddenCount = Math.max(projectCount - initialCertificationLimit, 0);
    const isExpanded = hiddenCount > 0 && expandedCertificationSections.has(section);
    control.dataset.hiddenCount = String(hiddenCount);
    control.textContent = isExpanded
        ? t('nav.view_less_certs', 'ver menos certificados')
        : `${t('nav.view_more_certs', 'ver mas certificados')} (${hiddenCount})`;
    control.setAttribute('aria-expanded', String(isExpanded));
    control.classList.toggle('is-disabled', hiddenCount === 0);
}

function updateCertificationCarouselButtons(carousel) {
    const track = carousel.querySelector('.showcase-cards-container');
    const previousButton = carousel.querySelector('.project-carousel-arrow-prev');
    const nextButton = carousel.querySelector('.project-carousel-arrow-next');
    const maxScrollLeft = track.scrollWidth - track.clientWidth;

    previousButton.disabled = track.scrollLeft <= 1;
    nextButton.disabled = track.scrollLeft >= maxScrollLeft - 1;
}

function initializeCertificationCarousel(certificationsShowcase) {
    const carousel = certificationsShowcase.querySelector('.project-section-carousel.has-arrows');
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
        window.requestAnimationFrame(() => updateCertificationCarouselButtons(carousel));
    }, { passive: true });
    updateCertificationCarouselButtons(carousel);
}

function showProjectCards(projects, section) {
    const certificationsShowcase = certificationsSections[section];

    if (!certificationsShowcase) {
        throw new Error(`No se encontró la sección para los proyectos: ${section}`);
    }

    updateMoreCertificationsControl(section, projects.length);

    if (projects.length === 0) {
        certificationsShowcase.innerHTML = `<p>${t('nav.no_projects_found', 'No se encontraron proyectos.')}</p>`;
        return;
    }

    const initialCertificationLimit = getInitialCertificationLimit();
    const isExpanded = projects.length > initialCertificationLimit
        && expandedCertificationSections.has(section);
    certificationsShowcase.innerHTML = `
        <div class="project-section-carousel${projects.length > 1 ? ' has-arrows' : ''}${isExpanded ? ' is-expanded' : ''}">
            ${projects.length > 1 ? `
                <button class="project-carousel-arrow project-carousel-arrow-prev" type="button" aria-label="${t('nav.prev_cert', 'Certificación anterior')}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
                </button>
            ` : ''}
            <div class="showcase-cards-container">
            ${projects.map((project, index) => {
                const projectDetailsUrl = `portfolio-details.html?id=${encodeURIComponent(project.id)}&type=design&section=${encodeURIComponent(project.section)}`;
                const isVideoProject = typeof project.view_project === 'string'
                    && /\.mp4(?:$|[?#])/i.test(project.view_project);
                const localizedTag = getLocalizedValue(project, 'project_tag');
                const moreProjectAction = isVideoProject
                    ? `<button class="github-link project-video-play" type="button" data-video-url="${encodeURIComponent(project.view_project)}">${t('nav.play_video', 'Reproducir')}<svg class="view-more-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>`
                    : `<a href="${project.view_project}" target="_blank" rel="noopener noreferrer">
                        <button class="github-link" type="button">${t('nav.view_more_btn', 'Ver más')}<svg class="view-more-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>
                    </a>`;

                return `
            <div class="card${index >= initialCertificationLimit ? ' project-card-overflow' : ''}">
                <div class="rate-condition-container certificate-card-header">
                    <div class="certificate-institution">
                        <div class="certificate-logo">
                            ${project.institution_logo
                                ? `<img src="${project.institution_logo}" alt="${t('nav.logo_of', 'Logo de')} ${localizedTag}" loading="lazy">`
                                : `<span>${t('nav.add_logo', 'Agregar logo')}</span>`}
                        </div>
                        <p class="category">${localizedTag}</p>
                    </div>
                    <div class="rating">
                        <p class="rating-stars">
                            <span class="rating-score">${project.rating}</span>
                            <span class="stars">★★★★★</span>
                        </p>
                    </div>
                </div>

                <div class="project-main-card-content">
                    <h4 class="project-main-title">${getLocalizedValue(project, 'title')}</h4>
                    <p class="project-main-description">${getLocalizedValue(project, 'description')}</p>
                </div>

                <div class="languages-tag-container">
                    ${project.tech_tags.map(tag => `<span class="language-tag">${tag}</span>`).join('')}
                </div>

                <div class="card-footer">
                    <p class="card-published">${getLocalizedValue(project, 'published')}</p>
                    <div class="card-actions">
                        <a class="project-details-link" href="${projectDetailsUrl}" data-project-id="${project.id}" data-portfolio-type="design" data-project-section="${project.section}">
                            <button class="preview-link" type="button">${t('nav.view_details', 'Ver detalles')}</button>
                        </a>
                        ${moreProjectAction}
                    </div>
                </div>
            </div>
            `;
            }).join('')}
            </div>
            ${projects.length > 1 ? `
                <button class="project-carousel-arrow project-carousel-arrow-next" type="button" aria-label="${t('nav.next_cert', 'Siguiente certificación')}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"></path></svg>
                </button>
            ` : ''}
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

    initializeCertificationCarousel(certificationsShowcase);
}

function renderProjects() {
    const projectTerm = normalizeSearchText(searchInput.value);
    const keywordTerm = normalizeSearchText(keywordSearchInput.value);
    const visibleProjects = allProjects.filter(project => {
        const localizedTitle = getLocalizedValue(project, 'title');
        const localizedDescription = getLocalizedValue(project, 'description');
        const localizedTag = getLocalizedValue(project, 'project_tag');
        const localizedPublished = getLocalizedValue(project, 'published');
        const localizedKeywords = getLocalizedValue(project, 'keywords', project.keywords);

        const searchableText = normalizeSearchText([
            project.title,
            localizedTitle,
            project.description,
            localizedDescription,
            project.project_tag,
            localizedTag,
            project.condition,
            project.rating,
            project.published,
            localizedPublished,
            project.section,
            ...(Array.isArray(localizedKeywords) ? localizedKeywords : []),
            ...(Array.isArray(project.tech_tags) ? project.tech_tags : [])
        ].join(' '));

        const keywords = normalizeSearchText(
            Array.isArray(localizedKeywords) ? localizedKeywords.join(' ') : ''
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

document.querySelectorAll('.view-more-link[data-project-section]').forEach(control => {
    control.addEventListener('click', event => {
        event.preventDefault();
        const section = control.dataset.projectSection;
        const hiddenCount = Number(control.dataset.hiddenCount || 0);

        if (hiddenCount === 0) {
            return;
        }

        if (expandedCertificationSections.has(section)) {
            expandedCertificationSections.delete(section);
        } else {
            expandedCertificationSections.add(section);
        }
        renderProjects();
    });
});

window.addEventListener('resize', () => {
    const nextInitialCertificationLimit = getInitialCertificationLimit();
    if (nextInitialCertificationLimit !== renderedInitialCertificationLimit) {
        renderedInitialCertificationLimit = nextInitialCertificationLimit;
        renderProjects();
    }
    document.querySelectorAll('.project-section-carousel.has-arrows').forEach(updateCertificationCarouselButtons);
});

window.addEventListener('languagechange', () => {
    if (allProjects.length) {
        renderProjects();
    }
});

showAllProjectsButton.addEventListener('click', () => {
    searchInput.value = '';
    keywordSearchInput.value = '';
    renderProjects();
});

async function obtainProducts() {
    try {
        const responseLocal = await fetch('certifications.json');
        const localProjects = await responseLocal.json();

        allProjects = [...localProjects];

        renderProjects();
    } catch (error) {
        console.log('Error al cargar los proyectos:', error);
    }
}

obtainProducts();