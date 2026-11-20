// Switches off every account the user-management flow created (emails `maestro.<time>@…`), pass
// or fail. There is no endpoint to delete a user, and the local demo database is meant for this:
// the accounts stay, switched off and out of the way, until the next `make demo`.
const api = 'http://localhost:8000/api';
const json = { 'Content-Type': 'application/json', Accept: 'application/json' };

const login = http.post(`${api}/auth/login`, {
  headers: json,
  body: JSON.stringify({ email: 'uros.minic@fifthguild.com', password: 'password' }),
});
const auth = { ...json, Authorization: `Bearer ${JSON.parse(login.body).data.token}` };

const users = JSON.parse(http.get(`${api}/users`, { headers: auth }).body).data;
users
  .filter((user) => user.email.startsWith('maestro.') && user.deactivated_at === null)
  .forEach((user) =>
    http.post(`${api}/users/${user.id}/deactivate`, { headers: auth, body: '{}' })
  );

// Maestro's HTTP client refuses a POST without a body.
http.post(`${api}/auth/logout`, { headers: auth, body: '{}' });
