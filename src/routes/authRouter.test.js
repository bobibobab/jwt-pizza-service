const request = require('supertest');
const app = require('../service');
const { setAuthUser } = require('./authRouter');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    testUser.name = Math.random().toString(36).substring(2, 12);
    testUser.password = Math.random().toString(36).substring(2, 12);
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
})

test('login and logout', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

    const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
    expect(loginRes.body.user).toMatchObject(user);

    const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logoutRes.status).toBe(200);
});

test('setAuthUser line 45-52', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);

    const token = loginRes.body.token; 

    const req = {
        headers: {
            authorization: `Bearer ${token}`,
        },
        user: null, // This will be set by setAuthUser
    };

    const res = {};
    const next = jest.fn();
    await setAuthUser(req, res, next);

    expect(req.user.name).toBeDefined();
    expect(req.user.isRole).toBeDefined();

    expect(next).toHaveBeenCalled();
});

test('update user test', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;


    const newEmail = Math.random().toString(36).substring(2, 12) + '@test.com';
    const newPassword = Math.random().toString(36).substring(2, 12);
    // how to get userId......
    const updateUser = await request(app).put(`/api/auth/${}`).set('Authorization', `Bearer ${token}`).send({ email: newEmail, password: newPassword});
    expect(updateUser.status).toBe(200);
    
    const { password, ...expectedUser } = { ...testUser, email: newEmail, roles: [{ role: 'diner' }] };
    expect(updateUser.body).toMatchObject(expectedUser);

    const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);
});

