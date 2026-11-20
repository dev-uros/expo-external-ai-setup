// Leaves the demo user used by the avatar flow without a picture, before the flow and after it,
// pass or fail — the demo
// database is shared, and the flow starts from "no picture". Removing a picture an account does
// not have is also a 200, so this is safe to run every time.
const api = 'http://localhost:8000/api';
const json = { 'Content-Type': 'application/json', Accept: 'application/json' };

const login = http.post(`${api}/auth/login`, {
  headers: json,
  body: JSON.stringify({ email: 'ana.nikolic@fifthguild.com', password: 'password' }),
});
const auth = { ...json, Authorization: `Bearer ${JSON.parse(login.body).data.token}` };

const me = JSON.parse(http.get(`${api}/auth/me`, { headers: auth }).body).data;
http.delete(`${api}/users/${me.id}/avatar`, { headers: auth });
// Maestro's HTTP client refuses a POST without a body.
http.post(`${api}/auth/logout`, { headers: auth, body: '{}' });
