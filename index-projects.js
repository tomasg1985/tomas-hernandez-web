(() => {
    const projectGrid = document.getElementById('home-projects');
    const moreButton = document.getElementById('home-projects-more');
    const filterButtons = Array.from(document.querySelectorAll('[data-project-filter]'));
    if (!projectGrid || !moreButton || !filterButtons.length) return;

    const pageSize = 10;
    let projects = [];
    let projectCards = [];
    let activeFilter = 'web';
    let visibleCount = pageSize;

    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);

    function createProjectCard(project) {
        const detailsUrl = `portfolio-details.html?id=${encodeURIComponent(project.id)}&type=${encodeURIComponent(project.type)}&section=${encodeURIComponent(project.section)}`;
        const card = document.createElement('article');
        card.className = 'thumbnail';
        card.dataset.categories = Array.isArray(project.categories) ? project.categories.join(' ') : '';
        card.innerHTML = `
            <a class="thumbnail-image-link" href="${detailsUrl}" tabindex="-1" aria-hidden="true">
                <span class="thumbnail-image" data-project-image="${escapeHtml(project.image || './assets/project-card-placeholder.svg')}"></span>
            </a>
            <div class="thumbnail-content">
                <p class="date">${escapeHtml(project.project_tag || project.published || 'Proyecto')}</p>
                <h2 class="title">${escapeHtml(project.title)}</h2>
                <a class="button" href="${detailsUrl}">Ver proyecto</a>
            </div>
        `;
        return card;
    }

    function renderProjects() {
        let matchingCount = 0;
        projectCards.forEach(card => {
            const matches = card.dataset.categories.split(' ').includes(activeFilter);
            const visible = matches && matchingCount < visibleCount;
            card.hidden = !visible;
            if (visible) {
                matchingCount += 1;
                const image = card.querySelector('[data-project-image]');
                if (!image.style.getPropertyValue('--project-image')) {
                    image.style.setProperty('--project-image', `url('${image.dataset.projectImage}')`);
                }
            }
        });

        let emptyMessage = projectGrid.querySelector('.home-projects-status');
        if (!matchingCount && !emptyMessage) {
            emptyMessage = document.createElement('p');
            emptyMessage.className = 'home-projects-status';
            emptyMessage.textContent = 'No hay proyectos en esta categoria todavia.';
            projectGrid.appendChild(emptyMessage);
        } else if (matchingCount && emptyMessage) {
            emptyMessage.remove();
        }

        const totalMatches = projectCards.filter(card => card.dataset.categories.split(' ').includes(activeFilter)).length;
        moreButton.hidden = totalMatches <= visibleCount;
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.projectFilter;
            visibleCount = pageSize;
            filterButtons.forEach(filterButton => {
                const selected = filterButton === button;
                filterButton.classList.toggle('is-active', selected);
                filterButton.setAttribute('aria-pressed', String(selected));
            });
            renderProjects();
        });
    });

    moreButton.addEventListener('click', () => {
        visibleCount += pageSize;
        renderProjects();
    });

    fetch('./index-projects.json')
        .then(response => {
            if (!response.ok) throw new Error(`No se pudo cargar index-projects.json (${response.status}).`);
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) throw new Error('El JSON de proyectos debe contener una lista.');
            projects = data;
            const cardsFragment = document.createDocumentFragment();
            projectCards = projects.map(project => {
                const card = createProjectCard(project);
                card.hidden = true;
                cardsFragment.appendChild(card);
                return card;
            });
            projectGrid.replaceChildren(cardsFragment);
            renderProjects();
        })
        .catch(error => {
            console.error('Error al cargar los proyectos del inicio:', error);
            projectGrid.innerHTML = '<p class="home-projects-status">No se pudieron cargar los proyectos. Abri esta pagina desde un servidor local o publicado.</p>';
            moreButton.hidden = true;
        });
})();
