const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

let admin;
let adminID;
let adminToken;


if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(36).substring(2, 12);
    user.email = user.name + '@admin.com';

    await DB.addUser(user);
    user.password = 'toomanysecrets';
    return user;
}

beforeAll(async () => {
    admin = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(admin);
    adminToken = loginRes.body.token;
    adminID = loginRes.body.user.id;
})

test('get menu test', async () => {
    const menu = await request(app).get('/api/order/menu').send(admin);
    expect(menu.status).toBe(200);
});

test('put menu test', async () => {

    const menu = {
        title: 'Student',
        description: 'No topping, no sauce, just carbs',
        image: 'pizza9.png',
        price: 0.0001
    }

    const menuRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminToken}`).send(menu);
    expect(menuRes.status).toBe(200);
});



