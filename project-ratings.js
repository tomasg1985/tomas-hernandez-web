(function (global) {
    const storagePrefix = 'portfolio-project-ratings-v1';
    const likesStoragePrefix = 'portfolio-project-likes-v1';
    const visitorStorageKey = 'portfolio-feedback-visitor-v1';
    const summaryCache = new Map();
    let visitorId;
    let remoteAvailable = false;

    function getStorageKey(project, portfolioType) {
        if (!project || !project.id || !project.section || !['web', 'design'].includes(portfolioType)) {
            throw new Error('No se pudo identificar el proyecto para guardar su calificación.');
        }

        return [
            storagePrefix,
            encodeURIComponent(portfolioType),
            encodeURIComponent(project.section),
            encodeURIComponent(project.id)
        ].join(':');
    }

    function getLikeStorageKey(project, portfolioType) {
        if (!project || !project.id || !project.section || !['web', 'design'].includes(portfolioType)) {
            throw new Error('No se pudo identificar el proyecto para guardar el Me gusta.');
        }

        return [
            likesStoragePrefix,
            encodeURIComponent(portfolioType),
            encodeURIComponent(project.section),
            encodeURIComponent(project.id)
        ].join(':');
    }

    function getProjectKey(project, portfolioType) {
        return [
            encodeURIComponent(portfolioType),
            encodeURIComponent(project.section),
            encodeURIComponent(project.id)
        ].join(':');
    }

    function getVisitorId() {
        if (visitorId) return visitorId;

        try {
            visitorId = global.localStorage.getItem(visitorStorageKey);
        } catch (error) {
            visitorId = null;
        }

        if (!visitorId) {
            visitorId = global.crypto?.randomUUID
                ? global.crypto.randomUUID()
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
                    const random = Math.random() * 16 | 0;
                    return (character === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
                });
            try {
                global.localStorage.setItem(visitorStorageKey, visitorId);
            } catch (error) {
                // Keep this session usable if browser storage is unavailable.
            }
        }

        return visitorId;
    }

    function setSummary(type, row) {
        const key = [
            encodeURIComponent(type),
            encodeURIComponent(row.project_section),
            encodeURIComponent(row.project_id)
        ].join(':');
        summaryCache.set(key, {
            average: row.average_rating === null ? null : Number(row.average_rating),
            count: Number(row.rating_count || 0),
            likeCount: Number(row.like_count || 0),
            visitorRating: row.visitor_rating === null || row.visitor_rating === undefined
                ? null
                : Number(row.visitor_rating),
            liked: Boolean(row.visitor_liked),
            synced: true
        });
    }

    function getCachedSummary(project, portfolioType) {
        return summaryCache.get(getProjectKey(project, portfolioType));
    }

    async function requestFeedback(payload, method = 'POST') {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        let endpoint = '/api/project-feedback';
        if (method === 'GET') {
            const query = new URLSearchParams(payload).toString();
            endpoint += `?${query}`;
        } else {
            options.body = JSON.stringify(payload);
        }

        const response = await global.fetch(endpoint, options);
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `La API respondió ${response.status}.`);
        }
        return result.feedback || [];
    }

    function cacheLocalSummary(project, portfolioType) {
        const key = getProjectKey(project, portfolioType);
        if (summaryCache.has(key)) return;
        const localSummary = getLocalSummary(project, portfolioType);
        summaryCache.set(key, {
            ...localSummary,
            likeCount: isLocalLike(project, portfolioType) ? 1 : 0,
            visitorRating: null,
            liked: isLocalLike(project, portfolioType),
            synced: false
        });
    }

    async function loadSummaries(projects, portfolioType) {
        projects.forEach(project => cacheLocalSummary(project, portfolioType));
        try {
            const rows = await requestFeedback({
                type: portfolioType,
                visitor_id: getVisitorId()
            }, 'GET');
            rows.forEach(row => setSummary(portfolioType, row));
            remoteAvailable = true;
            return true;
        } catch (error) {
            remoteAvailable = false;
            return false;
        }
    }

    function isLocalLike(project, portfolioType) {
        try {
            return global.localStorage.getItem(getLikeStorageKey(project, portfolioType)) === 'true';
        } catch (error) {
            console.error('No se pudo leer el Me gusta del proyecto.', error);
            return false;
        }
    }

    function writeLocalLike(project, portfolioType, liked) {
        try {
            global.localStorage.setItem(getLikeStorageKey(project, portfolioType), String(Boolean(liked)));
            return true;
        } catch (error) {
            console.error('No se pudo guardar el Me gusta del proyecto.', error);
            return false;
        }
    }

    function updateLikeButton(button, liked, likeCount = liked ? 1 : 0) {
        button.classList.toggle('is-liked', liked);
        button.setAttribute('aria-pressed', String(liked));
        button.setAttribute('aria-label', liked ? 'Quitar Me gusta del proyecto' : 'Me gusta este proyecto');
        const label = button.querySelector('[data-project-like-label]');
        const count = button.querySelector('[data-project-like-count]');
        if (label) label.textContent = liked ? 'Te gusta' : 'Me gusta';
        if (count) count.textContent = String(likeCount);
    }

    function bindLikeButton(button, project, portfolioType) {
        const key = getLikeStorageKey(project, portfolioType);
        button.dataset.projectLikeKey = key;
        const initialSummary = getCachedSummary(project, portfolioType);
        const initialState = initialSummary?.liked ?? isLocalLike(project, portfolioType);
        updateLikeButton(button, initialState, initialSummary?.likeCount ?? (initialState ? 1 : 0));
        button.addEventListener('click', async () => {
            const nextState = !(getCachedSummary(project, portfolioType)?.liked ?? isLocalLike(project, portfolioType));
            button.disabled = true;
            try {
                const result = await setProjectLike(project, portfolioType, nextState);
                global.document.querySelectorAll('[data-project-like-key]').forEach(candidate => {
                    if (candidate.dataset.projectLikeKey === key) {
                        updateLikeButton(candidate, result.liked, result.summary.likeCount);
                    }
                });
            } finally {
                button.disabled = false;
            }
        });
    }

    function readVotes(project, portfolioType) {
        const key = getStorageKey(project, portfolioType);
        let storedValue;

        try {
            storedValue = global.localStorage.getItem(key);
        } catch (error) {
            console.error('No se pudieron leer las calificaciones locales.', error);
            return [];
        }

        if (!storedValue) {
            return [];
        }

        let storedRatings;
        try {
            storedRatings = JSON.parse(storedValue);
        } catch (error) {
            console.error(`El registro local de calificaciones de ${key} no es válido.`, error);
            return [];
        }

        if (!storedRatings || !Array.isArray(storedRatings.votes)) {
            console.error(`El registro local de calificaciones de ${key} no tiene el formato esperado.`);
            return [];
        }

        const votes = storedRatings.votes.filter(
            vote => Number.isInteger(vote) && vote >= 1 && vote <= 5
        );
        if (votes.length !== storedRatings.votes.length) {
            console.error(`Se encontraron votos inválidos en el registro local de ${key}.`);
        }
        return votes;
    }

    function getLocalSummary(project, portfolioType) {
        const votes = readVotes(project, portfolioType);
        const average = votes.length
            ? votes.reduce((total, vote) => total + vote, 0) / votes.length
            : null;

        return {
            average,
            count: votes.length
        };
    }

    function getSummary(project, portfolioType) {
        return getCachedSummary(project, portfolioType) || getLocalSummary(project, portfolioType);
    }

    async function addVote(project, portfolioType, rating) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Error('La calificación debe ser un número entero entre 1 y 5.');
        }

        try {
            const rows = await requestFeedback({
                action: 'rating',
                type: portfolioType,
                section: project.section,
                project_id: String(project.id),
                visitor_id: getVisitorId(),
                rating
            });
            rows.forEach(row => setSummary(portfolioType, row));
            projects.forEach(project => {
                const key = getProjectKey(project, portfolioType);
                const summary = summaryCache.get(key);
                if (summary) summaryCache.set(key, { ...summary, synced: true });
            });
            remoteAvailable = true;
            return getSummary(project, portfolioType);
        } catch (error) {
            remoteAvailable = false;
            console.warn('No se pudo sincronizar la calificación; se guardará en este navegador.', error.message);
        }

        const key = getStorageKey(project, portfolioType);
        const votes = readVotes(project, portfolioType);
        votes.push(rating);

        try {
            global.localStorage.setItem(key, JSON.stringify({ votes }));
        } catch (error) {
            console.error('No se pudo guardar la calificación en este navegador.', error);
            throw error;
        }

        const summary = getLocalSummary(project, portfolioType);
        const current = getSummary(project, portfolioType);
        summaryCache.set(getProjectKey(project, portfolioType), {
            ...summary,
            likeCount: current.likeCount || 0,
            visitorRating: rating,
            liked: current.liked || false,
            synced: false
        });
        return getSummary(project, portfolioType);
    }

    async function setProjectLike(project, portfolioType, liked) {
        try {
            const rows = await requestFeedback({
                action: 'like',
                type: portfolioType,
                section: project.section,
                project_id: String(project.id),
                visitor_id: getVisitorId(),
                liked
            });
            rows.forEach(row => setSummary(portfolioType, row));
            remoteAvailable = true;
            return { liked, synced: true, summary: getSummary(project, portfolioType) };
        } catch (error) {
            remoteAvailable = false;
            console.warn('No se pudo sincronizar el Me gusta; se guardará en este navegador.', error.message);
            writeLocalLike(project, portfolioType, liked);
            const current = getSummary(project, portfolioType);
            const wasLiked = current.liked ?? isLocalLike(project, portfolioType);
            const currentLikeCount = Number(current.likeCount ?? (wasLiked ? 1 : 0));
            summaryCache.set(getProjectKey(project, portfolioType), {
                ...current,
                likeCount: Math.max(0, currentLikeCount + (liked === wasLiked ? 0 : liked ? 1 : -1)),
                liked,
                synced: false
            });
            return { liked, synced: false, summary: getSummary(project, portfolioType) };
        }
    }

    function formatAverage(average) {
        if (average === null) {
            return '—/5';
        }

        return `${Number(average.toFixed(1))}/5`;
    }

    function getCountLabel(count) {
        return count === 1 ? '1 voto' : `${count} votos`;
    }

    function getStarsHtml(average) {
        const filledStars = average === null ? 0 : Math.round(average);
        return Array.from({ length: 5 }, (_, index) => `
            <span class="rating-star ${index < filledStars ? 'is-filled' : 'is-empty'}" aria-hidden="true">${index < filledStars ? '★' : '☆'}</span>
        `).join('');
    }

    global.projectRatings = Object.freeze({
        addVote,
        formatAverage,
        getCountLabel,
        getStarsHtml,
        getSummary,
        loadSummaries,
        isRemoteAvailable: () => remoteAvailable
    });

    global.projectLikes = Object.freeze({
        bindButton: bindLikeButton,
        getStorageKey: getLikeStorageKey,
        isLiked: (project, portfolioType) =>
            getCachedSummary(project, portfolioType)?.liked ?? isLocalLike(project, portfolioType),
        setLiked: setProjectLike
    });

    global.addEventListener('storage', event => {
        if (!event.key || !event.key.startsWith(`${likesStoragePrefix}:`)) return;

        const liked = event.newValue === 'true';
        global.document.querySelectorAll('[data-project-like-key]').forEach(button => {
            if (button.dataset.projectLikeKey === event.key) {
                updateLikeButton(button, liked, liked ? 1 : 0);
            }
        });
    });
})(window);
