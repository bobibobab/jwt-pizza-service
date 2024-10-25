const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let testUserID;
let adminToken;
let admin;
let adminUserID;

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(36).substring(2, 12);
    user.email = user.name + '@admin.com';

    await DB.addUser(user);

    user.password = 'toomanysecrets';
    return user;
}


beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    testUser.name = Math.random().toString(36).substring(2, 12);
    testUser.password = Math.random().toString(36).substring(2, 12);
    admin = await createAdminUser();
    const registerRes = await request(app).post('/api/auth').send(testUser);
    const registerResForAdmin = await request(app).post('/api/auth').send(admin);
    testUserAuthToken = registerRes.body.token;
    testUserID = registerRes.body.user.id;
    adminUserID = registerResForAdmin.body.user.id;
    adminToken = registerResForAdmin.body.token;
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

test('update user test without role of admin', async () => {

    // const loginRes = await request(app).put('/api/auth').send(testUser);
    // expect(loginRes.status).toBe(200);
    const token = testUserAuthToken;

    const newEmail = Math.random().toString(36).substring(2, 12) + '@test.com';
    const newPassword = Math.random().toString(36).substring(2, 12);
    const userId = testUserID;
    const testID = 1;
    
    const updateUser = await request(app).put(`/api/auth/${userId}`).set('Authorization', `Bearer ${token}`).send({ email: newEmail, password: newPassword });
    // why 401? instead of 403.. 코드 보면 status 403 에 unauthorized 되어 있는데
    expect(updateUser.status).toBe(200);
    const updateByAdmin = await request(app).put(`/api/auth/${testID}`).set('Authorization', `Bearer ${adminToken}`).send({ email: newEmail, password: newPassword });
    // why 401?? is it supposed to be 200? because of admin token.
    expect(updateByAdmin.status).toBe(403);

});




