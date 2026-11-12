/**
 * Client Base44.
 *
 * Dans Base44, ce module est fourni par la plateforme : il expose
 * `base44.auth`, `base44.entities.<Nom>`, `base44.functions.invoke()` et
 * `base44.integrations.Core.*`. Le fichier présent est un équivalent local qui
 * reproduit exactement la même surface d’API, pour que l’app tourne hors
 * Base44 (démonstration, développement, captures).
 *
 * Deux modes, choisis par les variables d’environnement :
 *  - VITE_BASE44_API_URL + VITE_BASE44_APP_ID : les entités et les fonctions
 *    sont appelées en HTTP sur Base44 ;
 *  - sinon, mode démo local : entités en localStorage, fonctions renvoyant une
 *    erreur explicite (« fonction non déployée ») pour que l’interface reste
 *    navigable sans backend.
 */

const API_URL = import.meta.env.VITE_BASE44_API_URL || '';
const APP_ID = import.meta.env.VITE_BASE44_APP_ID || '';
export const IS_REMOTE = Boolean(API_URL && APP_ID);

const TOKEN_KEY = 'ecp_token';
const USER_KEY = 'ecp_user';
const DB_PREFIX = 'ecp_db_';

/* ---------------------------------------------------------------- stockage */

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota ou navigation privée : on ignore */
  }
}

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------- HTTP */

async function request(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}/apps/${APP_ID}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const error = new Error(data?.message || data?.error || `Erreur ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

/* ---------------------------------------------------------------- entités */

function matches(record, query = {}) {
  return Object.entries(query).every(([key, value]) => record?.[key] === value);
}

function sortRecords(records, sort) {
  if (!sort) return records;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const va = a?.[field] ?? '';
    const vb = b?.[field] ?? '';
    if (va === vb) return 0;
    return (va > vb ? 1 : -1) * (desc ? -1 : 1);
  });
}

function makeEntity(name) {
  const storeKey = `${DB_PREFIX}${name}`;
  const all = () => readStore(storeKey, []);
  const persist = (records) => writeStore(storeKey, records);

  return {
    async list(sort, limit) {
      if (IS_REMOTE) {
        const params = new URLSearchParams();
        if (sort) params.set('sort', sort);
        if (limit) params.set('limit', String(limit));
        return request(`/entities/${name}?${params}`);
      }
      const records = sortRecords(all(), sort || '-created_date');
      return limit ? records.slice(0, limit) : records;
    },

    async filter(query = {}, sort, limit) {
      if (IS_REMOTE) {
        const params = new URLSearchParams({ q: JSON.stringify(query) });
        if (sort) params.set('sort', sort);
        if (limit) params.set('limit', String(limit));
        return request(`/entities/${name}?${params}`);
      }
      const records = sortRecords(
        all().filter((record) => matches(record, query)),
        sort || '-created_date',
      );
      return limit ? records.slice(0, limit) : records;
    },

    async get(id) {
      if (IS_REMOTE) return request(`/entities/${name}/${id}`);
      return all().find((record) => record.id === id) || null;
    },

    async create(data) {
      if (IS_REMOTE) return request(`/entities/${name}`, { method: 'POST', body: data });
      const me = readStore(USER_KEY, null);
      const record = {
        ...data,
        id: uid(),
        created_by_id: me?.id || 'guest',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      persist([record, ...all()]);
      return record;
    },

    async update(id, data) {
      if (IS_REMOTE) return request(`/entities/${name}/${id}`, { method: 'PUT', body: data });
      const records = all();
      const index = records.findIndex((record) => record.id === id);
      if (index === -1) throw new Error(`${name} introuvable`);
      records[index] = { ...records[index], ...data, updated_date: new Date().toISOString() };
      persist(records);
      return records[index];
    },

    async delete(id) {
      if (IS_REMOTE) return request(`/entities/${name}/${id}`, { method: 'DELETE' });
      persist(all().filter((record) => record.id !== id));
      return { id };
    },
  };
}

/* ------------------------------------------------------------------- auth */

const auth = {
  async me() {
    if (IS_REMOTE) {
      if (!localStorage.getItem(TOKEN_KEY)) throw new Error('Non authentifié');
      return request('/auth/me');
    }
    const user = readStore(USER_KEY, null);
    if (!user) throw new Error('Non authentifié');
    return user;
  },

  isAuthenticated() {
    return IS_REMOTE ? Boolean(localStorage.getItem(TOKEN_KEY)) : Boolean(readStore(USER_KEY, null));
  },

  async updateMe(patch) {
    if (IS_REMOTE) return request('/auth/me', { method: 'PUT', body: patch });
    const user = readStore(USER_KEY, null);
    if (!user) throw new Error('Non authentifié');
    const next = { ...user, ...patch };
    writeStore(USER_KEY, next);
    return next;
  },

  async login({ email, password }) {
    if (IS_REMOTE) {
      const data = await request('/auth/login', { method: 'POST', body: { email, password } });
      if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
      return data;
    }
    if (!email || !password) throw new Error('Adresse e-mail et mot de passe requis.');
    const user = { id: uid(), email, full_name: email.split('@')[0], beginnerMode: true };
    writeStore(USER_KEY, user);
    localStorage.setItem(TOKEN_KEY, `demo-${user.id}`);
    return { user, token: `demo-${user.id}` };
  },

  async register({ email, password }) {
    if (IS_REMOTE) return request('/auth/register', { method: 'POST', body: { email, password } });
    return auth.login({ email, password });
  },

  async verifyOtp({ email, code }) {
    if (IS_REMOTE) return request('/auth/verify-otp', { method: 'POST', body: { email, code } });
    if (!code || code.length < 4) throw new Error('Code à 6 chiffres attendu.');
    const user = { id: uid(), email, full_name: email.split('@')[0], beginnerMode: true };
    writeStore(USER_KEY, user);
    return { user, token: `demo-${user.id}` };
  },

  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  },

  async resetPasswordRequest({ email }) {
    if (IS_REMOTE) return request('/auth/reset-password-request', { method: 'POST', body: { email } });
    return { ok: true };
  },

  async resetPassword({ token, password }) {
    if (IS_REMOTE) return request('/auth/reset-password', { method: 'POST', body: { token, password } });
    if (!password || password.length < 8) throw new Error('8 caractères minimum.');
    return { ok: true };
  },

  async logout() {
    localStorage.removeItem(TOKEN_KEY);
    if (!IS_REMOTE) localStorage.removeItem(USER_KEY);
    return { ok: true };
  },

  loginWithGoogle() {
    if (IS_REMOTE) {
      window.location.href = `${API_URL}/apps/${APP_ID}/auth/google`;
      return;
    }
    throw new Error('La connexion Google n’est disponible que sur Base44.');
  },
};

/* -------------------------------------------------------------- fonctions */

const functions = {
  async invoke(name, payload = {}) {
    if (IS_REMOTE) {
      const data = await request(`/functions/${name}`, { method: 'POST', body: payload });
      return { data };
    }
    const error = new Error(
      `La fonction « ${name} » n’est pas déployée dans ce mode démo. ` +
        'Importe le dossier base44/ dans ton app Base44, ou renseigne VITE_BASE44_API_URL et VITE_BASE44_APP_ID.',
    );
    error.code = 'FUNCTION_NOT_DEPLOYED';
    throw error;
  },
};

/* ----------------------------------------------------------- intégrations */

const integrations = {
  Core: {
    async UploadPublicFile({ file }) {
      if (IS_REMOTE) {
        const body = new FormData();
        body.append('file', file);
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch(`${API_URL}/apps/${APP_ID}/files/public`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body,
        });
        if (!res.ok) throw new Error('Envoi du fichier impossible.');
        return res.json();
      }
      return { file_url: await fileToDataUrl(file) };
    },

    async UploadPrivateFile(args) {
      return integrations.Core.UploadPublicFile(args);
    },
  },
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
}

export const base44 = {
  auth,
  functions,
  integrations,
  entities: {
    ShopifyAccount: makeEntity('ShopifyAccount'),
    ToolResult: makeEntity('ToolResult'),
  },
};

export default base44;
