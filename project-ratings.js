(function (global) {
    const storagePrefix = 'portfolio-project-ratings-v1';

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

    function getSummary(project, portfolioType) {
        const votes = readVotes(project, portfolioType);
        const average = votes.length
            ? votes.reduce((total, vote) => total + vote, 0) / votes.length
            : null;

        return {
            average,
            count: votes.length
        };
    }

    function addVote(project, portfolioType, rating) {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new Error('La calificación debe ser un número entero entre 1 y 5.');
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

        return getSummary(project, portfolioType);
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
        getSummary
    });
})(window);
