const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

let admin;
let adminID;
let adminToken;
let frachiseID;
let franchiseName;
let storeName;
let storeID;

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


test('get franchises test', async () => {
    const franchise = await request(app).get('/api/franchise').send(admin);
    expect(franchise.status).toBe(200);
});

test('get user franchises', async() => {
    //how to get userID? by register?
    
    const userFranchisesRes = await request(app).get(`/api/franchise/${adminID}`).set('Authorization', `Bearer ${adminToken}`);
    expect(userFranchisesRes.status).toBe(200);
 });

test('create franchises test', async () => {
    franchiseName = Math.random().toString(36).substring(2, 12);
    const franchiseData = {
        name: franchiseName,
        admins: [{ email: admin.email}]
    };

    const franchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${adminToken}`)  // Set the Authorization header
        .send(franchiseData); 

    expect(franchiseRes.status).toBe(200);
});

test('delete franchises test', async () => {
    franchiseName = Math.random().toString(36).substring(2, 12);
    const franchiseData = {
        name: franchiseName,
        admins: [{ email: admin.email }]
    };

    const franchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${adminToken}`)  // Set the Authorization header
        .send(franchiseData);

    expect(franchiseRes.status).toBe(200);
    frachiseID = franchiseRes.body.id;

    const deleteFranchise = await request(app).delete(`/api/franchise/${frachiseID}`).set('Authorization', `Bearer ${adminToken}`);
    expect(deleteFranchise.status).toBe(200);
});

test('create store test', async () => {
    franchiseName = Math.random().toString(36).substring(2, 12);
    const franchiseData = {
        name: franchiseName,
        admins: [{ email: admin.email }]
    };

    const franchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${adminToken}`)  // Set the Authorization header
        .send(franchiseData);

    expect(franchiseRes.status).toBe(200);
    frachiseID = franchiseRes.body.id;

    storeName = Math.random().toString(36).substring(2, 12);

    const storeData = {
        franchiseId: frachiseID,
        name: franchiseName
    }

    const storeRes = await request(app)
        .post(`/api/franchise/${frachiseID}/store`)
        .set('Authorization', `Bearer ${adminToken}`)  // Set the Authorization header
        .send(storeData);

    expect(storeRes.status).toBe(200);
});

test('delete store test', async () => {
    franchiseName = Math.random().toString(36).substring(2, 12);
    const franchiseData = {
        name: franchiseName,
        admins: [{ email: admin.email }]
    };

    const franchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${adminToken}`)  // Set the Authorization header
        .send(franchiseData);

    expect(franchiseRes.status).toBe(200);
    frachiseID = franchiseRes.body.id;

    storeName = Math.random().toString(36).substring(2, 12);

    const storeData = {
        franchiseId: frachiseID,
        name: franchiseName
    }

    const storeRes = await request(app)
        .post(`/api/franchise/${frachiseID}/store`)
        .set('Authorization', `Bearer ${adminToken}`)  // Set the Authorization header
        .send(storeData);

    expect(storeRes.status).toBe(200);
    storeID = storeRes.body.id;

    const deleteStore = await request(app).delete(`/api/franchise/${frachiseID}/store/${storeID}`).set('Authorization', `Bearer ${adminToken}`);
    expect(deleteStore.status).toBe(200);
});


