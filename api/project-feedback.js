const allowedTypes = new Set(['web', 'design']);
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sendJson(response, status, body) {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store, max-age=0');
    response.end(JSON.stringify(body));
}

function readBody(request) {
    if (request.body && typeof request.body === 'object') return request.body;
    if (typeof request.body === 'string') return JSON.parse(request.body);
    return {};
}

function validateIdentity(type, section, projectId, visitorId) {
    return allowedTypes.has(type)
        && typeof section === 'string'
        && section.trim().length > 0
        && section.length <= 100
        && typeof projectId === 'string'
        && projectId.trim().length > 0
        && projectId.length <= 100
        && typeof visitorId === 'string'
        && visitorIdPattern.test(visitorId);
}

async function supabaseRequest(path, secretKey, options = {}) {
    const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    if (!baseUrl) throw new Error('Falta configurar SUPABASE_URL.');

    const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
        ...options,
        headers: {
            apikey: secretKey,
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Supabase respondió ${response.status}: ${detail.slice(0, 400)}`);
    }

    const responseBody = await response.text();
    return responseBody ? JSON.parse(responseBody) : null;
}

async function getProjectFeedback(type, visitorId, secretKey) {
    return supabaseRequest('rpc/get_project_feedback', secretKey, {
        method: 'POST',
        body: JSON.stringify({
            p_project_type: type,
            p_visitor_id: visitorId
        })
    });
}

module.exports = async function handler(request, response) {
    if (request.method !== 'GET' && request.method !== 'POST') {
        response.setHeader('Allow', 'GET, POST');
        return sendJson(response, 405, { error: 'Método no permitido.' });
    }

    const secretKey = process.env.SUPABASE_SECRET_KEY
        || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secretKey) {
        return sendJson(response, 503, { error: 'La integración con Supabase todavía no está configurada.' });
    }

    try {
        const body = request.method === 'POST' ? readBody(request) : {};
        const params = new URL(request.url, 'https://vercel.local').searchParams;
        const type = request.method === 'GET' ? params.get('type') : body.type;
        const visitorId = request.method === 'GET' ? params.get('visitor_id') : body.visitor_id;

        if (!allowedTypes.has(type) || !visitorIdPattern.test(visitorId || '')) {
            return sendJson(response, 400, { error: 'El portfolio o el identificador del visitante no es válido.' });
        }

        if (request.method === 'GET') {
            const feedback = await getProjectFeedback(type, visitorId, secretKey);
            return sendJson(response, 200, { feedback });
        }

        const section = body.section;
        const projectId = String(body.project_id ?? '');
        if (!validateIdentity(type, section, projectId, visitorId)) {
            return sendJson(response, 400, { error: 'Los datos del proyecto o del visitante no son válidos.' });
        }

        if (body.action === 'rating') {
            if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
                return sendJson(response, 400, { error: 'La calificación debe ser un número del 1 al 5.' });
            }

            await supabaseRequest(
                'project_ratings?on_conflict=project_type,project_section,project_id,visitor_id',
                secretKey,
                {
                    method: 'POST',
                    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
                    body: JSON.stringify({
                        project_type: type,
                        project_section: section,
                        project_id: projectId,
                        visitor_id: visitorId,
                        rating: body.rating
                    })
                }
            );
        } else if (body.action === 'like') {
            if (typeof body.liked !== 'boolean') {
                return sendJson(response, 400, { error: 'El estado del Me gusta no es válido.' });
            }

            await supabaseRequest(
                'project_likes?on_conflict=project_type,project_section,project_id,visitor_id',
                secretKey,
                {
                    method: 'POST',
                    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
                    body: JSON.stringify({
                        project_type: type,
                        project_section: section,
                        project_id: projectId,
                        visitor_id: visitorId,
                        liked: body.liked
                    })
                }
            );
        } else {
            return sendJson(response, 400, { error: 'Acción no válida.' });
        }

        const feedback = await getProjectFeedback(type, visitorId, secretKey);
        return sendJson(response, 200, { feedback });
    } catch (error) {
        console.error('No se pudo procesar la interacción del proyecto:', error.message);
        return sendJson(response, 500, { error: 'No se pudo guardar o leer la interacción del proyecto.' });
    }
};
