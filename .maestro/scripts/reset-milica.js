// Puts the demo admin used by the profile flows back as the seeder left her. Runs on the host
// (not the device) after the flow, pass or fail — the demo database is shared, so a flow must
// never leave a renamed account behind.
//
// It signs in as a different admin on purpose: the flow may have changed Milica's own email, and
// then her account could no longer be used to undo it.
const api = 'http://localhost:8000/api';
const json = { 'Content-Type': 'application/json', Accept: 'application/json' };

const login = http.post(`${api}/auth/login`, {
  headers: json,
  body: JSON.stringify({ email: 'uros.minic@fifthguild.com', password: 'password' }),
});
const auth = { ...json, Authorization: `Bearer ${JSON.parse(login.body).data.token}` };

const users = JSON.parse(http.get(`${api}/users`, { headers: auth }).body).data;
const milica = users.find((user) => user.name === 'Milica');

http.put(`${api}/users/${milica.id}`, {
  headers: auth,
  body: JSON.stringify({
    name: 'Milica',
    surname: 'Jovanović',
    email: 'milica.jovanovic@fifthguild.com',
  }),
});
// Maestro's HTTP client refuses a POST without a body.
http.post(`${api}/auth/logout`, { headers: auth, body: '{}' });
