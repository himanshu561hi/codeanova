const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_BASE_URL = isLocal 
  ? "http://localhost:5005" 
  : "https://api.code-a-nova.online";

export const UPLOADS_URL = `${API_BASE_URL}/uploads`;
