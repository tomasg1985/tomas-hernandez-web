(function (global) {
    function esc(value) {
        return String(value).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // No uso new Date("2026-11-24") porque lo interpreta en UTC y en Argentina
    // mostraría el 23. Armo la fecha con año, mes y día locales.
    function formatDate(iso) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
        if (!m) return null;
        return new Date(+m[1], +m[2] - 1, +m[3])
            .toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function getHtml(project) {
        if (!project || project.in_progress !== true) return '';
        const date = formatDate(project.last_updated);
        return `
            <div class="project-status" role="status">
                <span class="project-status-dot" aria-hidden="true"></span>
                <span class="project-status-label">En desarrollo</span>
                ${date ? `<span class="project-status-date">Última modificación: ${esc(date)}</span>` : ''}
                ${project.update_note ? `<span class="project-status-note">${esc(project.update_note)}</span>` : ''}
            </div>`;
    }

    global.projectStatus = Object.freeze({ getHtml });
})(window);