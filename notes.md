# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | Database SQL |
| --------------------------------------------------- | ------------------ | ----------------- | ------------ |
| View home page                                      |home.tsx            |_None_             |_None_        |
| Register new user<br/>(t@jwt.com, pw: test)         |register.tsx        |[POST] /api/auth   |INSERT INTO user (name, email, password) VALUES (?, ?, ?) INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)                     |
| Login new user<br/>(t@jwt.com, pw: test)            |login.tsx           |[PUT] /api/auth    |INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token              |
| Order pizza                                         |menu.tsx            |[POST] /api/order  |INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now()) INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)              |
| Verify pizza                                        |delivery.tsx        |_This call is done directly to https://pizza-factory.cs329.click. It does not pass through the backend._[POST] /api/order/verify|_None, at least within the jwt-pizza or jwt-pizza-service repos._         |
| View profile page                                   |dinerDashboard.tsx  |[GET] /api/order|SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT ${offset} [user.id] SELECT id, menuId, description, price FROM orderItem WHERE orderId=?              |
| View franchise<br/>(as diner)                       |franchiseDashboard.tsx|[GET] /api/franchise/${user.id}|              |
| Logout                                              |logout.tsx          |[DELETE] /api/auth                   |              |
| View About page                                     |about.tsx           |_None_             |_None_        |
| View History page                                   |history.tsx         |_None_             |_None_        |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) |login.tsx           |[PUT] /api/auth    |              |
| View franchise<br/>(as franchisee)                  |franchiseDashboard.tsx|[GET] /api/franchise/${user.id}|              |
| Create a store                                      |createStore.tsx     |[POST]/api/franchise/${franchise.id}/store|        |
| Close a store                                       |closeStore.tsx      |[DELETE]/api/franchise/${franchise.id}/store/${store.id}|              |
| Login as admin<br/>(a@jwt.com, pw: admin)           |login.tsx           |[PUT] /api/auth    |              |
| View Admin page                                     |adminDashboard.tsx  |[GET] /api/franchise?page=${page}&limit=${limit}&name=${nameFilter}`                   |              |
| Create a franchise for t@jwt.com                    |createFranchise.tsx |[POST] /api/franchise|              |
| Close the franchise for t@jwt.com                   |closeFranchise.tsx  |[DELETE] /api/franchise/${franchise.id}|              |
