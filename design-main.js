const projectSections = {
    motion: document.getElementById('motion-graphics-projects'),
    video: document.getElementById('video-projects'),
    branding: document.getElementById('branding-projects'),
    social: document.getElementById('social'),
    packaging: document.getElementById('packaging-projects')
};

const searchInput = document.getElementById('design-project-search');
const keywordSearchInput = document.getElementById('design-keyword-search');
const showAllProjectsButton = document.getElementById('show-all-design-projects');
const videoPlayerDialog = document.getElementById('video-player-dialog');
const videoPlayer = document.getElementById('portfolio-video-player');
const videoPlayerStatus = document.getElementById('video-player-status');

let allProjects = [];
const expandedProjectSections = new Set();

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

function initializeProjectSectionReveal() {
    const main = document.querySelector('.portfolio-showcase-main-info');
    const buttonContainer = main?.querySelector('.view-more-container');
    const button = buttonContainer?.querySelector('.view-more-btn');
    const rows = Array.from(main?.querySelectorAll('.work-showcase-gallery') || [])
        .map(gallery => [gallery.previousElementSibling, gallery, gallery.nextElementSibling])
        .filter(row => row[0]?.querySelector('.showcase-container')
            && row[2]?.classList.contains('project-section-more'));
    const hiddenRows = rows.slice(4);

    if (!buttonContainer || !button || hiddenRows.length === 0) {
        if (buttonContainer) buttonContainer.hidden = true;
        return;
    }

    hiddenRows.flat().forEach(element => {
        element.hidden = true;
    });

    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        hiddenRows.flat().forEach(element => {
            element.hidden = isExpanded;
        });
        button.setAttribute('aria-expanded', String(!isExpanded));
        button.childNodes[0].textContent = isExpanded
            ? t('nav.view_more', 'Ver más')
            : t('nav.view_less', 'Ver menos');
    });
}

initializeProjectSectionReveal();

function getInitialProjectLimit() {
    if (window.matchMedia('(max-width: 992px)').matches) return 2;
    if (window.matchMedia('(max-width: 1200px)').matches) return 3;
    if (window.matchMedia('(max-width: 1500px)').matches) return 4;
    return 5;
}

let renderedInitialProjectLimit = getInitialProjectLimit();

if (videoPlayerDialog && videoPlayer) {
    videoPlayerDialog.addEventListener('close', () => {
        videoPlayer.pause();
        videoPlayer.removeAttribute('src');
        videoPlayer.load();
    });

    videoPlayer.addEventListener('error', () => {
        videoPlayerStatus.textContent = t('nav.video_load_error', 'No se pudo cargar este video.');
        videoPlayerStatus.hidden = false;
        console.error('Error al cargar el video del proyecto:', videoPlayer.error);
    });
}

function openProjectVideo(encodedUrl) {
    if (!videoPlayerDialog || !videoPlayer || !videoPlayerStatus) {
        console.error('No se encontró el reproductor independiente de video.');
        return;
    }

    videoPlayerStatus.hidden = true;
    videoPlayer.src = decodeURIComponent(encodedUrl);
    videoPlayer.removeAttribute('muted');
    videoPlayer.muted = false;
    videoPlayer.volume = 1;
    videoPlayerDialog.showModal();
    videoPlayer.play().catch(error => {
        videoPlayerStatus.textContent = t(
            'nav.video_play_error',
            'No se pudo iniciar el video. Usá los controles para reproducirlo.'
        );
        videoPlayerStatus.hidden = false;
        console.error('Error al iniciar el video del proyecto:', error);
    });
}

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

    const initialProjectLimit = getInitialProjectLimit();
    const hiddenCount = Math.max(projectCount - initialProjectLimit, 0);
    const isExpanded = hiddenCount > 0 && expandedProjectSections.has(section);
    control.dataset.hiddenCount = String(hiddenCount);
    control.textContent = isExpanded
        ? t('nav.view_less_projects', 'ver menos proyectos')
        : `${t('nav.view_more_projects', 'ver mas proyectos')} (${hiddenCount})`;
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
        projectsShowcase.innerHTML = `<p>${t('nav.no_projects_found', 'No se encontraron proyectos.')}</p>`;
        return;
    }

    const initialProjectLimit = getInitialProjectLimit();
    const isExpanded = projects.length > initialProjectLimit && expandedProjectSections.has(section);
    projectsShowcase.innerHTML = `
        <div class="project-section-carousel${projects.length > 1 ? ' has-arrows' : ''}${isExpanded ? ' is-expanded' : ''}">
            ${projects.length > 1 ? `
                <button class="project-carousel-arrow project-carousel-arrow-prev" type="button" aria-label="${t('nav.prev_project', 'Proyecto anterior')}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
                </button>
            ` : ''}
            <div class="showcase-cards-container">
            ${projects.map((project, index) => {
                const rating = projectRatings.getSummary(project, 'design');
                const ratingLabel = projectRatings.formatAverage(rating.average);
                const ratingCount = projectRatings.getCountLabel(rating.count);
                const ratingScope = rating.synced
                    ? t('nav.rating_global', 'global')
                    : t('nav.rating_local', 'local');
                const pluralSuffix = rating.count === 1 ? '' : (getCurrentLang() === 'en' ? 's' : 'es');
                const localCountLabel = `${ratingCount} ${ratingScope}${pluralSuffix}`;
                const localizedTag = getLocalizedValue(project, 'project_tag');
                const localizedCondition = getLocalizedValue(project, 'condition');
                const localizedTitle = getLocalizedValue(project, 'title');
                const localizedDescription = getLocalizedValue(project, 'description');
                const localizedPublished = getLocalizedValue(project, 'published');
                const localizedTechTags = getLocalizedValue(project, 'tech_tags', project.tech_tags);

                const projectLikeHtml = `
                    <button class="project-like-button card-project-like" type="button" aria-label="${t('nav.like_project_aria', 'Me gusta este proyecto')}" aria-pressed="false">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
                        <span data-project-like-label>${t('nav.like_label', 'Me gusta')}</span>
                        <span class="project-like-count" data-project-like-count>0</span>
                    </button>`;
                const projectDetailsUrl = `portfolio-details.html?id=${encodeURIComponent(project.id)}&type=design&section=${encodeURIComponent(project.section)}`;
                const isVideoProject = typeof project.view_project === 'string'
                    && /\.mp4(?:$|[?#])/i.test(project.view_project);
                const moreProjectAction = isVideoProject
                    ? `<button class="github-link project-video-play" type="button" data-video-url="${encodeURIComponent(project.view_project)}">${t('nav.play_video', 'Reproducir')}<svg class="view-more-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>`
                    : `<a href="${project.view_project}" target="_blank" rel="noopener noreferrer">
                        <button class="github-link" type="button">${t('nav.view_more_btn', 'Ver más')}<svg class="view-more-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>
                    </a>`;

                return `
            <div class="card${index >= initialProjectLimit ? ' project-card-overflow' : ''}">
                <div class="rate-condition-container">
                    <div class="condition-tag">
                        <p class="category">${localizedTag}</p>
                        <p class="new-tag">${localizedCondition}</p>
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
                    <h4 class="project-main-title">${localizedTitle}</h4>
                    <p class="project-main-description">${localizedDescription}</p>
                </div>

                <div class="languages-tag-container">
                    ${(Array.isArray(localizedTechTags) ? localizedTechTags : []).map(tag => `<span class="language-tag">${tag}</span>`).join('')}
                </div>

                <div class="card-footer">
                    <p class="card-published">${localizedPublished}</p>
                    ${projectLikeHtml}
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
                <button class="project-carousel-arrow project-carousel-arrow-next" type="button" aria-label="${t('nav.next_project', 'Proyecto siguiente')}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"></path></svg>
                </button>
            ` : ''}
        </div>
    `;

    projectsShowcase.querySelectorAll('.card-project-like').forEach((button, index) => {
        projectLikes.bindButton(button, projects[index], 'design');
    });

    projectsShowcase.querySelectorAll('.project-details-link').forEach(link => {
        link.addEventListener('click', () => {
            localStorage.setItem('selectedProjectId', link.dataset.projectId);
            localStorage.setItem('selectedPortfolioType', link.dataset.portfolioType);
            localStorage.setItem('selectedProjectSection', link.dataset.projectSection);
        });
    });

    projectsShowcase.querySelectorAll('.project-video-play').forEach(button => {
        button.addEventListener('click', () => {
            openProjectVideo(button.dataset.videoUrl);
        });
    });

    initializeProjectCarousel(projectsShowcase);
}

function renderProjects() {
    const projectTerm = normalizeSearchText(searchInput.value);
    const keywordTerm = normalizeSearchText(keywordSearchInput.value);
    const visibleProjects = allProjects.filter(project => {
        const localizedTitle = getLocalizedValue(project, 'title');
        const localizedDescription = getLocalizedValue(project, 'description');
        const localizedTag = getLocalizedValue(project, 'project_tag');
        const localizedCondition = getLocalizedValue(project, 'condition');
        const localizedPublished = getLocalizedValue(project, 'published');
        const localizedKeywords = getLocalizedValue(project, 'keywords', project.keywords);
        const localizedTechTags = getLocalizedValue(project, 'tech_tags', project.tech_tags);

        const searchableText = normalizeSearchText([
            project.title,
            localizedTitle,
            project.description,
            localizedDescription,
            project.project_tag,
            localizedTag,
            project.condition,
            localizedCondition,
            project.published,
            localizedPublished,
            project.section,
            ...(Array.isArray(localizedKeywords) ? localizedKeywords : []),
            ...(Array.isArray(localizedTechTags) ? localizedTechTags : [])
        ].join(' '));

        const keywords = normalizeSearchText(
            Array.isArray(localizedKeywords) ? localizedKeywords.join(' ') : ''
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
    const nextInitialProjectLimit = getInitialProjectLimit();
    if (nextInitialProjectLimit !== renderedInitialProjectLimit) {
        renderedInitialProjectLimit = nextInitialProjectLimit;
        renderProjects();
    }
    document.querySelectorAll('.project-section-carousel.has-arrows').forEach(updateProjectCarouselButtons);
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
        const responseLocal = await fetch('design_portfolio.json');
        const localProjects = await responseLocal.json();

        allProjects = [...localProjects];
        await projectRatings.loadSummaries(allProjects, 'design');

        renderProjects();
    } catch (error) {
        console.log('Error al cargar los proyectos:', error);
    }
}

obtainProducts();

window.addEventListener('pageshow', async event => {
    if (event.persisted && allProjects.length) {
        await projectRatings.loadSummaries(allProjects, 'design');
        renderProjects();
    }
});

window.addEventListener('storage', event => {
    if (event.key && (
        event.key.startsWith('portfolio-project-ratings-v1:')
        || event.key.startsWith('portfolio-project-likes-v1:')
    )) {
        renderProjects();
    }
});