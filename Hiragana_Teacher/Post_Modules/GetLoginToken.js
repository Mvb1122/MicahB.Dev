// Use sent user information to run the GetLoginToken() function in the index.js file.
let userInfo = JSON.parse(data);
let token = GetLoginToken(userInfo);
let response = {
    token: await token
}

res.statusCode = 200;
res.setHeader("Content-Type", "application/json");
return res.end(JSON.stringify(response));