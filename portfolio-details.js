const portfolioDetails = document.getElementById('details-container');
const detailsStatus = document.getElementById('details-status');
const detailsLinks = document.getElementById('details-links');
const detailsContent = document.getElementById('details-content');
const detailCoverContainer = document.getElementById('detail-cover-container');
const detailCoverImage = document.getElementById('detail-cover-image');
const detailParams = new URLSearchParams(window.location.search);
const selectedProjectId = Number.parseInt(
    detailParams.get('id') || localStorage.getItem('selectedProjectId'),
    10
);
const selectedPortfolioType = detailParams.get('type')
    || localStorage.getItem('selectedPortfolioType');
const selectedProjectSection = detailParams.get('section')
    || localStorage.getItem('selectedProjectSection');
let returnToPortfolioUrl = `web-portfolio.html`;
if (selectedPortfolioType === 'design') {
    returnToPortfolioUrl = `design-portfolio.html`;
}
const allowedDescriptionTags = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'ul',
    'ol',
    'li'
]);
const softwareInitials = new Map([
    ['AFTER EFFECTS', 'AE'],
    ['ILLUSTRATOR', 'AI'],
    ['PREMIERE PRO', 'PR'],
    ['INDESIGN', 'ID'],
    ['PHOTOSHOP', 'PS'],
    ['INSTAGRAM', 'IG'],
    ['HTML', 'HTML'],
    ['CSS', 'CSS'],
    ['JAVASCRIPT', 'JS'],
    ['WORDPRESS', 'WP'],
    ['WOOCOMMERCE', 'WC'],
    ['ELEMENTOR', 'EL'],
    ['PYTHON', 'PY'],
    ['POSTGRESQL', 'PG'],
    ['APIREST', 'API'],
    ['DOCKER', 'DK'],
    ['REACT', 'RE'],
    ['NOJEJS', 'JS'],
    ['TAILWIND', 'TW'],
    ['JWT', 'JWT'],
    ['VITE', 'V'],
    ['EXPRESS', 'EX'],
    ['FIGMA', 'FG'],
    ['FASTAPI', 'FA'],
    ['SERPER.DEV', 'SD']
]);

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function getSoftwareInitials(software) {
    const name = software.trim().toUpperCase();
    const initials = softwareInitials.get(name);
    if (initials) {
        return initials;
    }

    return name.split(/[^A-Z0-9]+/)
        .filter(Boolean)
        .slice(0, 3)
        .map(word => word[0])
        .join('') || '?';
}

function sanitizeDescriptionNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createDocumentFragment();
    }

    const tagName = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes, sanitizeDescriptionNode);
    if (!allowedDescriptionTags.has(tagName)) {
        const fragment = document.createDocumentFragment();
        children.forEach(child => fragment.appendChild(child));
        return fragment;
    }

    const safeElement = document.createElement(tagName);
    children.forEach(child => safeElement.appendChild(child));
    return safeElement;
}

function getDescriptionHtml(markup) {
    const template = document.createElement('template');
    template.innerHTML = String(markup ?? '');
    const container = document.createElement('div');
    Array.from(template.content.childNodes, sanitizeDescriptionNode)
        .forEach(node => container.appendChild(node));
    return container.innerHTML;
}

function getExtraDetails(project) {
    // Cada *_description agrega una sección con su título en el campo *_title correspondiente.
    return Object.entries(project)
        .filter(([key]) => key.endsWith('_description'))
        .map(([descriptionKey, description]) => {
            const sectionName = descriptionKey.slice(0, -'_description'.length);
            return {
                title: project[`${sectionName}_title`],
                description
            };
        })
        .filter(section => section.title || section.description);
}

function getLocalVoteLabel(count) {
    const countLabel = projectRatings.getCountLabel(count);
    return projectRatings.isRemoteAvailable()
        ? `${countLabel} en total`
        : `${countLabel} local${count === 1 ? '' : 'es'} en este navegador`;
}

function getDetailRatingScore(average) {
    return average === null ? '—' : String(Number(average.toFixed(1)));
}

function getProjectRatingHtml(project) {
    const summary = projectRatings.getSummary(project, selectedPortfolioType);
    const isLiked = projectLikes.isLiked(project, selectedPortfolioType);
    const visitorRating = summary.visitorRating;
    const ratingLabel = projectRatings.formatAverage(summary.average);
    const accessibleRating = summary.count
        ? `${ratingLabel}, ${projectRatings.getCountLabel(summary.count)}`
        : 'Sin calificaciones locales';

    return `
        <section class="detail-rating-section" aria-labelledby="detail-rating-title">
            <div class="detail-rating-header">
                <div>
                    <p class="detail-rating-eyebrow">Opinión del proyecto</p>
                    <h3 id="detail-rating-title" class="detail-rating-title">¿Qué te pareció este proyecto?</h3>
                </div>
                <div class="detail-rating-header-actions">
                    <span class="detail-rating-badge">Tu opinión cuenta</span>
                    <button class="project-like-button detail-project-like" type="button"
                            aria-label="Me gusta este proyecto" aria-pressed="${isLiked}">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
                        <span data-project-like-label>${isLiked ? 'Te gusta' : 'Me gusta'}</span>
                        <span class="project-like-count" data-project-like-count>${isLiked ? '1' : '0'}</span>
                    </button>
                </div>
            </div>
            <div class="detail-rating-content">
                <div class="detail-rating-summary">
                    <p class="detail-rating-summary-label">Promedio del proyecto</p>
                    <div class="detail-rating-value">
                        <div class="detail-rating-score-wrap">
                            <span class="detail-rating-score" data-rating-average>${getDetailRatingScore(summary.average)}</span>
                            <span class="detail-rating-score-scale">/ 5</span>
                        </div>
                        <span class="detail-rating-stars" data-rating-stars role="img" aria-label="${escapeHtml(accessibleRating)}">${projectRatings.getStarsHtml(summary.average)}</span>
                    </div>
                    <p class="detail-rating-count" data-rating-count>${getLocalVoteLabel(summary.count)}</p>
                </div>
                <form class="detail-rating-form">
                    <fieldset class="detail-rating-fieldset">
                        <legend>Dejá tu calificación</legend>
                        <div class="detail-rating-choices">
                            ${[1, 2, 3, 4, 5].map(rating => `
                                <label class="detail-rating-choice">
                                <input type="radio" name="project-rating" value="${rating}" aria-label="${rating} de 5 estrellas" ${visitorRating === rating ? 'checked' : ''} required>
                                    <span class="detail-rating-choice-star" aria-hidden="true">★</span>
                                </label>
                            `).join('')}
                        </div>
                    </fieldset>
                    <button class="detail-rating-submit" type="submit" disabled>Enviar calificación</button>
                </form>
            </div>
            <p class="detail-rating-privacy-note">${projectRatings.isRemoteAvailable()
                ? 'Las calificaciones se comparten entre visitantes. Este navegador recuerda tu voto para que puedas actualizarlo.'
                : 'El servicio compartido todavía no está configurado; por ahora, las calificaciones se guardan en este navegador.'}</p>
            <p class="detail-rating-note" role="status" aria-live="polite"></p>
        </section>
    `;
}

function updateProjectRatingSummary(summary) {
    const ratingSection = detailsContent.querySelector('.detail-rating-section');
    const ratingLabel = projectRatings.formatAverage(summary.average);
    const countLabel = getLocalVoteLabel(summary.count);
    const accessibleRating = summary.count
        ? `${ratingLabel}, ${projectRatings.getCountLabel(summary.count)}`
        : 'Sin calificaciones locales';

    ratingSection.querySelector('[data-rating-average]').textContent = getDetailRatingScore(summary.average);
    ratingSection.querySelector('[data-rating-count]').textContent = countLabel;
    const stars = ratingSection.querySelector('[data-rating-stars]');
    stars.innerHTML = projectRatings.getStarsHtml(summary.average);
    stars.setAttribute('aria-label', accessibleRating);
}

function initializeProjectRating(project) {
    const ratingSection = detailsContent.querySelector('.detail-rating-section');
    const form = ratingSection.querySelector('.detail-rating-form');
    const submitButton = form.querySelector('.detail-rating-submit');
    const status = ratingSection.querySelector('.detail-rating-note');

    const updateSelection = () => {
        const selectedInput = form.querySelector('input[name="project-rating"]:checked');
        const selectedRating = selectedInput ? Number(selectedInput.value) : 0;
        form.querySelectorAll('.detail-rating-choice').forEach(choice => {
            const input = choice.querySelector('input');
            const star = choice.querySelector('.detail-rating-choice-star');
            star.classList.toggle('is-selected', Number(input.value) <= selectedRating);
        });
        submitButton.disabled = selectedRating === 0;
    };

    form.querySelectorAll('input[name="project-rating"]').forEach(input => {
        input.addEventListener('change', updateSelection);
    });
    updateSelection();

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const selectedInput = form.querySelector('input[name="project-rating"]:checked');
        if (!selectedInput) {
            status.textContent = 'Seleccioná una calificación antes de enviarla.';
            return;
        }

        try {
            const summary = await projectRatings.addVote(
                project,
                selectedPortfolioType,
                Number(selectedInput.value)
            );
            updateProjectRatingSummary(summary);
            form.reset();
            updateSelection();
            status.textContent = summary.synced
                ? `¡Gracias! La calificación se compartió. ${getLocalVoteLabel(summary.count)}`
                : `¡Gracias! Se guardó solo en este navegador. ${getLocalVoteLabel(summary.count)}`;
        } catch (error) {
            console.error('No se pudo guardar la calificación del proyecto:', error);
            status.textContent = 'No se pudo guardar la calificación en este navegador. Intentá nuevamente.';
        }
    });
}

function initializeProjectLike(project) {
    const button = detailsContent.querySelector('.detail-project-like');
    if (button) {
        projectLikes.bindButton(button, project, selectedPortfolioType);
    }
}

function showDetailsMessage(message) {
    if (detailsStatus && detailsLinks && detailsContent) {
        detailsStatus.textContent = message;
        detailsStatus.hidden = false;
        detailsLinks.hidden = false;
        detailsContent.hidden = true;
    }
}

// Genera todo el contenido del proyecto en una plantilla editable.
function renderProjectDetails(project) {
    const techTags = Array.isArray(project.tech_tags)
        ? project.tech_tags.filter(tag => typeof tag === 'string' && tag.trim())
        : [];
    const techStackHtml = techTags.map(tag => `
        <div class="icon-area">
            <span class="software-initials" aria-hidden="true">${escapeHtml(getSoftwareInitials(tag))}</span>
            <h5 class="headline">Software:</h5>
            <p class="description">${escapeHtml(tag)}</p>
        </div>
    `).join('');
    const galleryImages = Array.isArray(project.gallery_images)
        ? project.gallery_images.filter(image => typeof image === 'string' && image.trim())
        : [];
    const galleryItems = galleryImages.length > 0
        ? galleryImages
        : Array.from({ length: 3 }, (_, i) => `https://placehold.co/200x250?text=Proyecto+${i + 1}`);
    const galleryHtml = galleryItems.map((image, index) => `
        <figure class="gallery-item" data-gallery-index="${index}">
            <button class="gallery-image-button" type="button"
                    data-gallery-image="${escapeHtml(image)}"
                    aria-label="Ver ${escapeHtml(project.title)} - imagen ${index + 1} en tamaño grande">
                <img src="${escapeHtml(image)}" alt="${galleryImages.length
                    ? `${escapeHtml(project.title)} - imagen ${index + 1}`
                    : ''}">
                <span class="gallery-expand-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>
                </span>
            </button>
            <button class="gallery-like-button" type="button"
                    data-gallery-like="${index}"
                    aria-label="Me gusta esta imagen"
                    aria-pressed="false">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/>
                </svg>
                <span class="gallery-like-label">Me gusta</span>
            </button>
        </figure>
    `).join('');
    const extraDetails = getExtraDetails(project);
    const extraDetailsHtml = extraDetails.map(section => `
        <div class="detail-extra-section">
            <h4 class="challenge-detail-headline">${escapeHtml(section.title || '')}</h4>
            <div class="detail-description">${getDescriptionHtml(section.description || '')}</div>
        </div>
    `).join('');
    const extraDetailsCarouselHtml = extraDetails.length
        ? `
        <div class="extra-details-carousel${extraDetails.length > 1 ? ' has-arrows' : ''}">
            ${extraDetails.length > 1 ? `
                <button class="extra-details-arrow extra-details-arrow-prev" type="button" aria-label="Sección anterior">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
                </button>
            ` : ''}
            <div class="extra-details-main-row">${extraDetailsHtml}</div>
            ${extraDetails.length > 1 ? `
                <button class="extra-details-arrow extra-details-arrow-next" type="button" aria-label="Sección siguiente">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"></path></svg>
                </button>
            ` : ''}
        </div>
        `
        : '';
    const projectRatingHtml = getProjectRatingHtml(project);
    const bannerImageSource = project.banner_image
        || project.cover_image
        || project.image
        || project.capture-image
        || './assets/banner-placeholder.svg';
    const captureImageSource = project.capture_image
        || project['capture-image']
        || project.captureImage
        || './assets/banner-placeholder-2.svg';
    const projectLinkHtml = project.view_project && project.view_project !== '#'
        ? `<a id="detail-project-link" class="detail-project-link github-link live-preview-btn social-btn"
                href="${escapeHtml(project.view_project)}" target="_blank"
                rel="noopener noreferrer">Previsualizar</a>`
        : '';
    const socialLinkHtml = project.social && project.social !== '#'
        ? `<a id="social-btn" class="social-btn"
                href="${escapeHtml(project.social)}" target="_blank"
                rel="noopener noreferrer">Ver Red Social</a>`
        : '';

    detailCoverContainer.hidden = false;
    detailCoverImage.src = bannerImageSource;
    detailCoverImage.alt = project.image_alt || `Banner principal de ${project.title || 'proyecto'}`;
    detailCoverImage.hidden = false;
    detailsStatus.hidden = true;
    detailsLinks.hidden = true;
    detailsContent.hidden = false;
    detailsContent.innerHTML = `
        <div class="detail-main-row">
            <div class="description-section">

                <h5 class="detail-category">${escapeHtml(project.project_tag || project.section || '')}</h5>
                <h4 class="detail-headline">${escapeHtml(project.title || '')}</h4>
                <div class="detail-description">${getDescriptionHtml(project.description || '')}</div>
                <div class="tech-icons-container">
                    <div class="tech-icons-section">${techStackHtml}</div>
                </div>
                <div class="social-btn-container">
                    ${socialLinkHtml}
                </div>
                
            </div>
            <div class="showcase-section">${galleryHtml}</div>
        </div>
        ${extraDetailsCarouselHtml}
        <div class="screen-capture-section">
                <div class="capture">
                    <div>
                        <img src="${escapeHtml(captureImageSource)}" alt="Captura de pantalla de ${escapeHtml(project.title || 'proyecto')}">
                    </div>
                    <div class="button-container">
                        <div class="live-preview-main">
                            <a>${projectLinkHtml}</a>
                            <a class="return-to-main" href="${returnToPortfolioUrl}">Volver a proyectos</a>
                        </div>
                    </div>
                </div>
        </div>
        ${projectRatingHtml}
    `;

    initializeProjectRating(project);
    initializeProjectLike(project);
    initializeGalleryInteractions(project);
    initializeExtraDetailsCarousel();

    document.title = `Portfolio | ${project.title || ''}`;
}

function getGalleryLikeKey(project, image) {
    return [
        'portfolio-gallery-likes-v1',
        encodeURIComponent(selectedPortfolioType),
        encodeURIComponent(project.section),
        encodeURIComponent(project.id),
        encodeURIComponent(image)
    ].join(':');
}

function readGalleryLike(project, image) {
    try {
        return localStorage.getItem(getGalleryLikeKey(project, image)) === 'true';
    } catch (error) {
        console.error('No se pudo leer el Me gusta de la imagen.', error);
        return false;
    }
}

function writeGalleryLike(project, image, liked) {
    try {
        localStorage.setItem(getGalleryLikeKey(project, image), String(liked));
        return true;
    } catch (error) {
        console.error('No se pudo guardar el Me gusta de la imagen.', error);
        return false;
    }
}

function initializeGalleryInteractions(project) {
    const galleryItems = Array.from(detailsContent.querySelectorAll('.gallery-item'));
    if (galleryItems.length === 0) {
        return;
    }

    let lightbox = detailsContent.querySelector('.gallery-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.className = 'gallery-lightbox';
        lightbox.hidden = true;
        lightbox.innerHTML = `
            <div class="gallery-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen">
                <button class="gallery-lightbox-close" type="button" aria-label="Cerrar vista ampliada">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
                </button>
                <button class="gallery-lightbox-arrow gallery-lightbox-prev" type="button" aria-label="Imagen anterior">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <img class="gallery-lightbox-image" src="" alt="">
                <button class="gallery-lightbox-arrow gallery-lightbox-next" type="button" aria-label="Imagen siguiente">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                <p class="gallery-lightbox-counter" aria-live="polite"></p>
            </div>
        `;
        detailsContent.appendChild(lightbox);
    }

    const lightboxImage = lightbox.querySelector('.gallery-lightbox-image');
    const lightboxCounter = lightbox.querySelector('.gallery-lightbox-counter');
    const closeButton = lightbox.querySelector('.gallery-lightbox-close');
    const previousButton = lightbox.querySelector('.gallery-lightbox-prev');
    const nextButton = lightbox.querySelector('.gallery-lightbox-next');
    let activeIndex = 0;
    let previousFocus = null;

    const showLightboxImage = index => {
        activeIndex = (index + galleryItems.length) % galleryItems.length;
        const item = galleryItems[activeIndex];
        const source = item.querySelector('.gallery-image-button').dataset.galleryImage;
        const image = item.querySelector('img');
        lightboxImage.src = source;
        lightboxImage.alt = image.alt;
        lightboxCounter.textContent = `${activeIndex + 1} / ${galleryItems.length}`;
        previousButton.hidden = galleryItems.length < 2;
        nextButton.hidden = galleryItems.length < 2;
    };

    const closeLightbox = () => {
        lightbox.hidden = true;
        document.body.classList.remove('gallery-lightbox-open');
        lightboxImage.src = '';
        if (previousFocus) {
            previousFocus.focus();
        }
    };

    const openLightbox = (index, trigger) => {
        previousFocus = trigger;
        showLightboxImage(index);
        lightbox.hidden = false;
        document.body.classList.add('gallery-lightbox-open');
        closeButton.focus();
    };

    galleryItems.forEach((item, index) => {
        const imageButton = item.querySelector('.gallery-image-button');
        const likeButton = item.querySelector('.gallery-like-button');
        const imageSource = imageButton.dataset.galleryImage;
        const liked = readGalleryLike(project, imageSource);

        const updateLikeButton = isLiked => {
            likeButton.classList.toggle('is-liked', isLiked);
            likeButton.setAttribute('aria-pressed', String(isLiked));
            likeButton.querySelector('.gallery-like-label').textContent = isLiked ? 'Te gusta' : 'Me gusta';
        };

        updateLikeButton(liked);

        imageButton.addEventListener('click', () => openLightbox(index, imageButton));
        likeButton.addEventListener('click', () => {
            const nextLiked = likeButton.getAttribute('aria-pressed') !== 'true';
            if (writeGalleryLike(project, imageSource, nextLiked)) {
                updateLikeButton(nextLiked);
            }
        });
    });

    closeButton.addEventListener('click', closeLightbox);
    previousButton.addEventListener('click', () => showLightboxImage(activeIndex - 1));
    nextButton.addEventListener('click', () => showLightboxImage(activeIndex + 1));
    lightbox.addEventListener('click', event => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });
    document.addEventListener('keydown', event => {
        if (lightbox.hidden) {
            return;
        }
        if (event.key === 'Escape') {
            closeLightbox();
        } else if (event.key === 'ArrowLeft') {
            showLightboxImage(activeIndex - 1);
        } else if (event.key === 'ArrowRight') {
            showLightboxImage(activeIndex + 1);
        }
    });
}

function initializeExtraDetailsCarousel() {
    const carousel = detailsContent.querySelector('.extra-details-carousel.has-arrows');
    if (!carousel) {
        return;
    }

    const track = carousel.querySelector('.extra-details-main-row');
    const previousButton = carousel.querySelector('.extra-details-arrow-prev');
    const nextButton = carousel.querySelector('.extra-details-arrow-next');

    const updateButtons = () => {
        const maxScrollLeft = track.scrollWidth - track.clientWidth;
        previousButton.disabled = track.scrollLeft <= 1;
        nextButton.disabled = track.scrollLeft >= maxScrollLeft - 1;
    };

    previousButton.addEventListener('click', () => {
        track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
    });
    nextButton.addEventListener('click', () => {
        track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
    });
    track.addEventListener('scroll', () => window.requestAnimationFrame(updateButtons), { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
}

async function loadProjectDetails() {
    if (!portfolioDetails) {
        console.error('No se encontró el contenedor de detalles del proyecto.');
        return;
    }

    detailsStatus.textContent = 'Cargando detalles del proyecto...';
    detailsStatus.hidden = false;
    detailsLinks.hidden = true;
    detailsContent.hidden = true;

    if (!Number.isSafeInteger(selectedProjectId) || selectedProjectId < 1) {
        showDetailsMessage('No se seleccionó ningún proyecto.');
        return;
    }

    if (!['web', 'design'].includes(selectedPortfolioType)) {
        showDetailsMessage('No se pudo identificar el portfolio de origen. Seleccioná el proyecto nuevamente.');
        return;
    }

    const detailsDataFile = selectedPortfolioType === 'design'
        ? 'design_portfolio_details.json'
        : 'web_portfolio_details.json';
    const portfolioDataFile = selectedPortfolioType === 'design'
        ? 'design_portfolio.json'
        : 'web_portfolio.json';

    try {
        const [detailsResponse, portfolioResponse] = await Promise.all([
            fetch(detailsDataFile, { cache: 'no-store' }),
            fetch(portfolioDataFile, { cache: 'no-store' })
        ]);
        if (!detailsResponse.ok) {
            throw new Error(`No se pudo cargar ${detailsDataFile}: ${detailsResponse.status}`);
        }
        if (!portfolioResponse.ok) {
            throw new Error(`No se pudo cargar ${portfolioDataFile}: ${portfolioResponse.status}`);
        }

        const [projects, portfolioProjects] = await Promise.all([
            detailsResponse.json(),
            portfolioResponse.json()
        ]);
        if (!Array.isArray(projects)) {
            throw new Error(`El archivo ${detailsDataFile} no contiene una lista de proyectos.`);
        }
        if (!Array.isArray(portfolioProjects)) {
            throw new Error(`El archivo ${portfolioDataFile} no contiene una lista de proyectos.`);
        }

        const matchingProjects = projects.filter(item => Number(item.id) === selectedProjectId);
        const project = selectedProjectSection
            ? matchingProjects.find(item => item.section === selectedProjectSection)
            : matchingProjects.length === 1 ? matchingProjects[0] : null;
        if (!project) {
            showDetailsMessage('No se encontró el proyecto seleccionado o falta identificar su sección.');
            return;
        }

        const portfolioProject = portfolioProjects.find(item =>
            Number(item.id) === selectedProjectId && item.section === project.section
        );
        if (!portfolioProject) {
            throw new Error(`No se encontró el proyecto relacionado en ${portfolioDataFile}.`);
        }

        await projectRatings.loadSummaries([portfolioProject], selectedPortfolioType);
        renderProjectDetails(project);
    } catch (error) {
        console.error('Error al cargar los detalles del proyecto:', error);
        showDetailsMessage('Error al cargar la información del proyecto.');
    }
}

loadProjectDetails();
