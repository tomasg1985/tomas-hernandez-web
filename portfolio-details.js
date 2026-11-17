const portfolioDetails = document.getElementById('details-container');
const detailsStatus = document.getElementById('details-status');
const detailsLinks = document.getElementById('details-links');
const detailsContent = document.getElementById('details-content');
const detailCoverContainer = document.getElementById('detail-cover-container');
const detailCoverImage = document.getElementById('detail-cover-image');
const detailCoverVideo = document.getElementById('detail-cover-video');
const detailCategory = document.getElementById('detail-category');
const detailHeadline = document.getElementById('detail-headline');
const detailDescription = document.getElementById('detail-description');
const detailTechStack = document.getElementById('detail-tech-stack');
const detailProjectLink = document.getElementById('detail-project-link');
const detailGallery = document.getElementById('detail-gallery');
const detailParams = new URLSearchParams(window.location.search);
const selectedProjectId = Number.parseInt(
    detailParams.get('id') || localStorage.getItem('selectedProjectId'),
    10
);
const selectedPortfolioType = detailParams.get('type')
    || localStorage.getItem('selectedPortfolioType');
const selectedProjectSection = detailParams.get('section')
    || localStorage.getItem('selectedProjectSection');
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

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
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

function renderDescription(markup) {
    const template = document.createElement('template');
    template.innerHTML = String(markup ?? '');
    detailDescription.replaceChildren(
        ...Array.from(template.content.childNodes, sanitizeDescriptionNode)
    );
}

function showDetailsMessage(message) {
    if (detailsStatus && detailsLinks && detailsContent) {
        detailsStatus.textContent = message;
        detailsStatus.hidden = false;
        detailsLinks.hidden = false;
        detailsContent.hidden = true;
    }
}

function renderProjectDetails(project) {
    const techTags = Array.isArray(project.tech_tags)
        ? project.tech_tags.filter(tag => typeof tag === 'string')
        : [];
    const galleryImages = Array.isArray(project.gallery_images)
        ? project.gallery_images.filter(image => typeof image === 'string' && image.trim())
        : [];
    const galleryItems = galleryImages.length
        ? galleryImages
        : Array.from({ length: 8 }, () => 'https://placehold.co/200x200');
    const coverImageSource = project.cover_image || project.image || 'https://placehold.co/2375x700';
    const videoSource = project.video_url
        || (typeof project.view_project === 'string' && /\.mp4(?:$|[?#])/i.test(project.view_project)
            ? project.view_project
            : '');

    detailsStatus.hidden = true;
    detailsLinks.hidden = true;
    detailsContent.hidden = false;
    detailCategory.textContent = project.project_tag || project.section || '';
    detailHeadline.textContent = project.title || '';
    renderDescription(project.description || '');
    detailTechStack.innerHTML = techTags.map(tag => `
        <div class="icon-area">
            <img src="https://placehold.co/70x70" alt="">
            <h5 class="headline">Software:</h5>
            <p class="description">${escapeHtml(tag)}</p>
        </div>
    `).join('');
    detailGallery.innerHTML = galleryItems.map((image, index) => `
        <img src="${escapeHtml(image)}" alt="${galleryImages.length
            ? `${escapeHtml(project.title)} - imagen ${index + 1}`
            : ''}">
    `).join('');
    detailGallery.hidden = false;
    detailCoverContainer.hidden = false;
    if (videoSource) {
        detailCoverVideo.src = videoSource;
        detailCoverVideo.muted = false;
        detailCoverVideo.volume = 1;
        detailCoverVideo.hidden = false;
        detailCoverImage.hidden = true;
        detailCoverVideo.load();
    } else {
        detailCoverVideo.pause();
        detailCoverVideo.removeAttribute('src');
        detailCoverVideo.hidden = true;
        detailCoverImage.src = coverImageSource;
        detailCoverImage.alt = project.image_alt || project.title || '';
        detailCoverImage.hidden = false;
    }

    if (project.view_project && project.view_project !== '#') {
        detailProjectLink.href = project.view_project;
        detailProjectLink.textContent = 'Ver proyecto';
        detailProjectLink.target = '_blank';
        detailProjectLink.rel = 'noopener noreferrer';
        detailProjectLink.hidden = false;
    } else {
        detailProjectLink.hidden = true;
    }

    document.title = `Portfolio | ${project.title}`;
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

    const dataFile = selectedPortfolioType === 'design'
        ? 'design_portfolio_details.json'
        : 'web_portfolio_details.json';

    try {
        const response = await fetch(dataFile, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`No se pudo cargar ${dataFile}: ${response.status}`);
        }

        const projects = await response.json();
        if (!Array.isArray(projects)) {
            throw new Error(`El archivo ${dataFile} no contiene una lista de proyectos.`);
        }

        const matchingProjects = projects.filter(item => Number(item.id) === selectedProjectId);
        const project = selectedProjectSection
            ? matchingProjects.find(item => item.section === selectedProjectSection)
            : matchingProjects.length === 1 ? matchingProjects[0] : null;
        if (!project) {
            showDetailsMessage('No se encontró el proyecto seleccionado o falta identificar su sección.');
            return;
        }

        renderProjectDetails(project);
    } catch (error) {
        console.error('Error al cargar los detalles del proyecto:', error);
        showDetailsMessage('Error al cargar la información del proyecto.');
    }
}

loadProjectDetails();
