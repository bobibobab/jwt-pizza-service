const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

let admin;

beforeAll(async () => {
    admin = createAdminUser();
})


async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = Math.random().toString(36).substring(2, 12);
    user.email = user.name + '@admin.com';

    await DB.addUser(user);
    // I think I am getting an error of adding user into the database.
    // This is what I got: {"message":"Error initializing database","exception":"Encoding not recognized: 'cesu8' (searched as: 'cesu8')","connection":{"host":"127.0.0.1","user":"root","password":"Fleh1234!@#$","database":"pizza","connectTimeout":60000}}
    
    user.password = 'toomanysecrets ';
    return user;
}

test('get franchises test', async () => {
    const franchise = await request(app).get('/api/franchise').send(admin);
    expect(franchise.status).toBe(200);
});

test('create franchises test', async () => {

    //how to get admin token...
    const token...;

    const franchiseData = {
        name: 'New Franchise',
        location: '123 Franchise Ave',
        owner: 'John Doe'
    };

    const franchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${token}`)  // Set the Authorization header
        .send(franchiseData); 

    const franchise = await request(app).post('/api/franchise').send(franchiseRes);
    expect(franchise.status).toBe(200);
});